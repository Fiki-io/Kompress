import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import {
  UPLOADS_DIR,
  OUTPUTS_DIR,
  probeVideo,
  generateSampleVideo,
  processVideoCompression,
  jobStore,
  saveJobsToDisk,
  loadJobsFromDisk,
  CompressionOptions,
} from './ffmpegService.ts';

const router = express.Router();

// Setup Multer for handling file uploads safely
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const uniqueName = `input_${Date.now()}_${randomUUID().slice(0, 8)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1 GB max limit
  },
});

/**
 * Endpoint to analyze an uploaded video file.
 */
router.post('/analyze', upload.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada berkas video yang diunggah.' });
    }

    const filePath = req.file.path;
    const metadata = await probeVideo(filePath);

    res.json({
      filePath,
      filename: req.file.originalname,
      metadata,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menganalisis video';
    res.status(500).json({ error: msg });
  }
});

/**
 * Endpoint to trigger synthetic sample video generation for quick testing.
 */
router.post('/sample', async (_req: Request, res: Response) => {
  try {
    const samplePath = await generateSampleVideo();
    const metadata = await probeVideo(samplePath);

    res.json({
      filePath: samplePath,
      filename: 'sample_motion_grain.mp4',
      metadata,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal membuat sampel video';
    res.status(500).json({ error: msg });
  }
});

/**
 * Endpoint to start a video compression job.
 */
router.post('/compress', (req: Request, res: Response) => {
  try {
    const {
      filePath,
      options,
    }: {
      filePath: string;
      options: CompressionOptions;
    } = req.body;

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(400).json({ error: 'Berkas sumber tidak valid atau tidak ditemukan.' });
    }

    const jobId = randomUUID();
    jobStore.set(jobId, {
      id: jobId,
      status: 'queued',
      progress: 0,
      originalPath: filePath,
      createdAt: Date.now(),
    });
    saveJobsToDisk();

    // Run async in background
    processVideoCompression(jobId, options).catch((err) => {
      console.error(`Error in compression job ${jobId}:`, err);
    });

    res.json({ jobId });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memulai kompresi';
    res.status(500).json({ error: msg });
  }
});

/**
 * Endpoint to poll compression job status.
 */
router.get('/status/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;
  let job = jobStore.get(jobId);

  if (!job) {
    loadJobsFromDisk();
    job = jobStore.get(jobId);
  }

  // If job is still missing from memory/disk, check if output file was created on disk
  if (!job) {
    const outputPath = path.join(OUTPUTS_DIR, `compressed_${jobId}.mp4`);
    if (fs.existsSync(outputPath)) {
      try {
        const outMeta = await probeVideo(outputPath);
        job = {
          id: jobId,
          status: 'completed',
          progress: 100,
          originalPath: '',
          outputPath,
          outputMeta: outMeta,
          createdAt: Date.now(),
        };
        jobStore.set(jobId, job);
        saveJobsToDisk();
      } catch (e) {
        console.error('Failed to probe recovered output video:', e);
      }
    }
  }

  if (!job) {
    return res.status(404).json({ error: 'Pekerjaan tidak ditemukan atau sesi telah berakhir.' });
  }

  res.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    currentFps: job.currentFps,
    speed: job.speed,
    error: job.error,
    originalMeta: job.originalMeta,
    outputMeta: job.outputMeta,
  });
});

/**
 * Endpoint to stream videos (original or compressed) with HTTP 206 partial content support.
 */
router.get('/stream/:type/:jobId', (req: Request, res: Response) => {
  const { type, jobId } = req.params;
  let job = jobStore.get(jobId);

  if (!job) {
    loadJobsFromDisk();
    job = jobStore.get(jobId);
  }

  if (!job) {
    // If output file exists, allow streaming even if job record is missing
    const fallbackPath = path.join(OUTPUTS_DIR, `compressed_${jobId}.mp4`);
    if (type !== 'original' && fs.existsSync(fallbackPath)) {
      const stat = fs.statSync(fallbackPath);
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': 'video/mp4',
      });
      return fs.createReadStream(fallbackPath).pipe(res);
    }
    return res.status(404).send('Pekerjaan tidak ditemukan.');
  }

  const targetPath = type === 'original' ? job.originalPath : job.outputPath;
  if (!targetPath || !fs.existsSync(targetPath)) {
    return res.status(404).send('Berkas video tidak ditemukan di server.');
  }

  const stat = fs.statSync(targetPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const fileStream = fs.createReadStream(targetPath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    });
    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    });
    fs.createReadStream(targetPath).pipe(res);
  }
});

/**
 * Direct file download endpoint.
 */
router.get('/download/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = jobStore.get(jobId);

  if (!job || !job.outputPath || !fs.existsSync(job.outputPath)) {
    return res.status(404).send('Berkas hasil kompresi tidak tersedia.');
  }

  const filename = `ultra_compressed_${jobId.slice(0, 8)}.mp4`;
  res.download(job.outputPath, filename);
});

export default router;
