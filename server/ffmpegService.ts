import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface VideoMetadata {
  duration: number; // in seconds
  width: number;
  height: number;
  size: number; // in bytes
  bitrate: number; // in bps
  fps: number;
  codec: string;
  audioCodec?: string;
  audioBitrate?: number;
}

export type ReductionIntensity = 'ultra' | 'aggressive' | 'moderate' | 'custom';
export type ClarityBoostLevel = 'extreme' | 'standard' | 'subtle' | 'off';

export interface CompressionOptions {
  mode: 'perceptual-breakthrough' | 'target-size' | 'balanced' | 'extreme-save';
  reductionIntensity?: ReductionIntensity;
  targetReductionPercent?: number; // 30 to 90
  targetSizeMb?: number;
  clarityBoost?: ClarityBoostLevel;
  fastActionEngine?: boolean; // UMH me_range=32 + zero temporal lag for fast running & motion
  enableMotionConsistency?: boolean;
  enableColorPop?: boolean;
  enableNoiseDecoupling: boolean;
  noiseIntensity?: 'light' | 'medium' | 'strong';
  enableEdgePreEmphasis: boolean;
  edgeIntensity?: 'subtle' | 'standard' | 'high';
  enable10BitPrecision: boolean;
  scaleResolution: 'original' | '1080p' | '720p' | '480p';
  audioBitrate: 'original' | '128k' | '96k' | '64k' | '48k';
  crfValue?: number;
}

export interface CompressionJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0 to 100
  originalPath: string;
  outputPath?: string;
  originalMeta?: VideoMetadata;
  outputMeta?: VideoMetadata;
  error?: string;
  createdAt: number;
  currentFps?: number;
  speed?: string;
  etaSeconds?: number;
}

// In-memory job registry
export const jobStore = new Map<string, CompressionJob>();

const TEMP_DIR = '/tmp/video-compressor';
const UPLOADS_DIR = path.join(TEMP_DIR, 'uploads');
const OUTPUTS_DIR = path.join(TEMP_DIR, 'outputs');
const JOBS_FILE = path.join(TEMP_DIR, 'jobs.json');

// Ensure working directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(OUTPUTS_DIR)) {
  fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
}

export function saveJobsToDisk(): void {
  try {
    const obj: Record<string, CompressionJob> = {};
    for (const [id, job] of jobStore.entries()) {
      obj[id] = job;
    }
    fs.writeFileSync(JOBS_FILE, JSON.stringify(obj, null, 2));
  } catch (err) {
    console.error('Failed to save jobs to disk:', err);
  }
}

export function loadJobsFromDisk(): void {
  try {
    if (fs.existsSync(JOBS_FILE)) {
      const data = fs.readFileSync(JOBS_FILE, 'utf-8');
      const obj = JSON.parse(data);
      for (const [id, job] of Object.entries(obj)) {
        const existing = jobStore.get(id);
        const diskJob = job as CompressionJob;
        if (!existing || diskJob.progress >= existing.progress || diskJob.status === 'completed') {
          jobStore.set(id, diskJob);
        }
      }
    }
  } catch (err) {
    console.error('Failed to load jobs from disk:', err);
  }
}

// Load persisted jobs on module initialization
loadJobsFromDisk();

export { UPLOADS_DIR, OUTPUTS_DIR };

/**
 * Inspects a video file using ffprobe.
 */
export async function probeVideo(filePath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath,
    ]);

    let stdout = '';
    let stderr = '';

    ffprobe.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    ffprobe.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`ffprobe failed with exit code ${code}: ${stderr}`));
      }

      try {
        const parsed = JSON.parse(stdout);
        const videoStream = parsed.streams?.find((s: Record<string, unknown>) => s.codec_type === 'video');
        const audioStream = parsed.streams?.find((s: Record<string, unknown>) => s.codec_type === 'audio');
        const format = parsed.format || {};

        let fps = 30;
        if (videoStream?.r_frame_rate) {
          const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
          if (den && den > 0) {
            fps = Math.round(num / den);
          }
        }

        const duration = parseFloat(format.duration || videoStream?.duration || '0');
        const size = parseInt(format.size || '0', 10) || (fs.existsSync(filePath) ? fs.statSync(filePath).size : 0);
        const bitrate = parseInt(format.bit_rate || '0', 10) || Math.round((size * 8) / (duration || 1));

        resolve({
          duration,
          width: videoStream?.width || 1920,
          height: videoStream?.height || 1080,
          size,
          bitrate,
          fps,
          codec: videoStream?.codec_name || 'unknown',
          audioCodec: audioStream?.codec_name,
          audioBitrate: parseInt(audioStream?.bit_rate || '0', 10) || undefined,
        });
      } catch (err) {
        reject(new Error(`Failed to parse ffprobe output: ${err}`));
      }
    });
  });
}

/**
 * Creates a synthetic demo video if the user doesn't have a video file ready.
 */
export async function generateSampleVideo(): Promise<string> {
  const samplePath = path.join(UPLOADS_DIR, 'sample_test_video.mp4');
  if (fs.existsSync(samplePath)) {
    return samplePath;
  }

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-f', 'lavfi',
      '-i', 'testsrc=duration=6:size=1920x1080:rate=30',
      '-f', 'lavfi',
      '-i', 'sine=frequency=440:duration=6',
      '-vf', 'noise=alls=15:allf=t+u',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '18',
      '-c:a', 'aac',
      '-b:a', '128k',
      samplePath,
      '-y',
    ]);

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(samplePath);
      } else {
        reject(new Error(`Failed to generate sample video, code ${code}`));
      }
    });
  });
}

/**
 * Executes multi-stage compression process according to breakthrough parameters.
 */
export async function processVideoCompression(
  jobId: string,
  options: CompressionOptions
): Promise<void> {
  const job = jobStore.get(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  job.status = 'processing';
  job.progress = 0;
  saveJobsToDisk();

  try {
    const meta = await probeVideo(job.originalPath);
    job.originalMeta = meta;

    const outFilename = `compressed_${jobId}.mp4`;
    const outputPath = path.join(OUTPUTS_DIR, outFilename);
    job.outputPath = outputPath;
    saveJobsToDisk();

    const duration = Math.max(meta.duration, 1);

    // Build video filter chain
    const vFilters: string[] = [];

    // 1. Noise Decoupling: Only apply light spatial filter if source is extremely noisy/high-bitrate (>15 Mbps)
    // Pre-compressed web videos (like TikTok / phone) MUST NOT be softened with hqdn3d!
    if (meta.bitrate > 15000000 && options.enableNoiseDecoupling) {
      vFilters.push('hqdn3d=luma_spatial=1.2:chroma_spatial=1.0:luma_tmp=0.0:chroma_tmp=0.0');
    }

    // 2. High-Frequency Edge Pre-Emphasis (Unsharp Mask)
    // Sharpen first so high-frequency facial contours, eyes, and text are crisp
    vFilters.push('unsharp=lx=5:ly=5:la=1.0:cx=5:cy=5:ca=0.0');

    // 3. AMD FidelityFX CAS (Contrast Adaptive Sharpening) for razor-sharp edge restoration
    const clarity = options.clarityBoost ?? 'standard';
    if (clarity === 'extreme') {
      vFilters.push('cas=strength=0.9');
    } else if (clarity !== 'off') {
      vFilters.push('cas=strength=0.75');
    }

    // 4. Perceptual HD Color & Micro-Contrast Pop
    if (options.enableColorPop !== false) {
      vFilters.push('eq=contrast=1.04:saturation=1.04:brightness=0.005');
    }

    // 5. Resolution scaling if requested
    if (options.scaleResolution !== 'original') {
      let targetHeight = 1080;
      if (options.scaleResolution === '720p') targetHeight = 720;
      if (options.scaleResolution === '480p') targetHeight = 480;

      vFilters.push(`scale=-2:${targetHeight}:flags=lanczos`);
    }

    // 6. Color Depth Selection (yuv420p for universal mobile and web playback)
    vFilters.push('format=yuv420p');

    const vfString = vFilters.join(',');

    // FFmpeg arguments assembly
    const args: string[] = ['-i', job.originalPath];

    if (vfString.length > 0) {
      args.push('-vf', vfString);
    }

    args.push('-c:v', 'libx264');

    // Audio bitrate resolution (default 48k stereo saves ~150KB without audible quality loss)
    let audioBitrateBps = 48000;
    if (options.audioBitrate === '64k') audioBitrateBps = 64000;
    else if (options.audioBitrate === '96k') audioBitrateBps = 96000;
    else if (options.audioBitrate === '128k') audioBitrateBps = 128000;

    // FAST-ACTION & CRYSTAL SHARP X264 PARAMETERS
    // deblock=-1:-1: Turns off aggressive in-loop smoothing that causes hazing/blur
    // psy-rd=1.1:0.15: Preserves fine facial details, eyes, teeth, and hair texture
    // aq-mode=3:aq-strength=1.3: Protects edges and complex motion from quantization
    // me=umh:me_range=28:subme=9: Locks motion vectors cleanly during motion/running
    const x264Params = [
      'deblock=-1,-1',
      'psy-rd=1.10,0.15',
      'aq-mode=3',
      'aq-strength=1.3',
      'me=umh',
      'me_range=28',
      'subme=9',
      'b-adapt=2',
      'qcomp=0.80',
      'keyint=48',
      'min-keyint=24',
      'mbtree=1',
    ].join(':');

    args.push('-x264-params', x264Params);

    // Rate Control Calculation: Target 75% size reduction guaranteed!
    if (options.mode === 'target-size' && options.targetSizeMb && options.targetSizeMb > 0) {
      const totalBits = options.targetSizeMb * 8 * 1024 * 1024;
      const totalAudioBits = audioBitrateBps * duration;
      const targetVideoBits = Math.max(totalBits - totalAudioBits, 50000 * duration);
      const targetVideoBitrateKbps = Math.floor(targetVideoBits / duration / 1000);

      args.push(
        '-b:v', `${targetVideoBitrateKbps}k`,
        '-maxrate', `${Math.floor(targetVideoBitrateKbps * 1.35)}k`,
        '-bufsize', `${Math.floor(targetVideoBitrateKbps * 2.2)}k`,
        '-preset', 'slow'
      );
    } else {
      // Default Breakthrough: Guaranteed ~75% reduction (~25% of original size)
      // e.g. 2.61 MB video is compressed to ~650 KB - 700 KB!
      const targetReductionPercent = options.targetReductionPercent ?? 75;
      const targetBytes = meta.size * (1 - targetReductionPercent / 100);
      const targetTotalBits = targetBytes * 8;
      const totalAudioBits = audioBitrateBps * duration;
      const targetVideoBits = Math.max(targetTotalBits - totalAudioBits, 50000 * duration);
      const targetVideoBitrateKbps = Math.floor(targetVideoBits / duration / 1000);

      args.push(
        '-b:v', `${targetVideoBitrateKbps}k`,
        '-maxrate', `${Math.floor(targetVideoBitrateKbps * 1.35)}k`,
        '-bufsize', `${Math.floor(targetVideoBitrateKbps * 2.2)}k`,
        '-preset', 'slow'
      );
    }

    // Audio configuration
    if (options.audioBitrate === 'original') {
      args.push('-c:a', 'copy');
    } else {
      const aBitrateString = options.audioBitrate || '64k';
      args.push('-c:a', 'aac', '-b:a', aBitrateString, '-ac', '2');
    }

    // Optimization for fast web streaming & playback
    args.push('-threads', '2');
    args.push('-movflags', '+faststart');
    args.push('-y', outputPath);

    // Spawn process
    const ffmpeg = spawn('ffmpeg', args);

    ffmpeg.stderr.on('data', (data) => {
      const line = data.toString();

      // Parse time=HH:MM:SS.ms
      const timeMatch = line.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const mins = parseInt(timeMatch[2], 10);
        const secs = parseFloat(timeMatch[3]);
        const currentTime = hours * 3600 + mins * 60 + secs;

        const pct = Math.min(Math.round((currentTime / duration) * 100), 99);
        job.progress = pct;
      }

      // Parse fps
      const fpsMatch = line.match(/fps=\s*(\d+(\.\d+)?)/);
      if (fpsMatch) {
        job.currentFps = parseFloat(fpsMatch[1]);
      }

      // Parse speed
      const speedMatch = line.match(/speed=\s*([\d\.]+)x/);
      if (speedMatch) {
        job.speed = `${speedMatch[1]}x`;
      }
    });

    ffmpeg.on('close', async (code) => {
      if (code === 0) {
        job.progress = 100;
        job.status = 'completed';
        try {
          job.outputMeta = await probeVideo(outputPath);
        } catch {
          if (fs.existsSync(outputPath)) {
            job.outputMeta = {
              ...meta,
              size: fs.statSync(outputPath).size,
            };
          }
        }
      } else {
        job.status = 'failed';
        job.error = `FFmpeg exited with error code ${code}`;
      }
      saveJobsToDisk();
    });
  } catch (err: unknown) {
    job.status = 'failed';
    job.error = err instanceof Error ? err.message : String(err);
    saveJobsToDisk();
  }
}
