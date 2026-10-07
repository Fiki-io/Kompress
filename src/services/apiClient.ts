import { VideoMetadata, CompressionOptions, CompressionJobResponse } from '../types/video.ts';

export async function analyzeVideoFile(file: File): Promise<{
  filePath: string;
  filename: string;
  metadata: VideoMetadata;
}> {
  const formData = new FormData();
  formData.append('video', file);

  const res = await fetch('/api/analyze', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Gagal menganalisis video' }));
    throw new Error(errorData.error || 'Gagal menganalisis berkas video');
  }

  return res.json();
}

export async function generateSampleVideo(): Promise<{
  filePath: string;
  filename: string;
  metadata: VideoMetadata;
}> {
  const res = await fetch('/api/sample', {
    method: 'POST',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Gagal membuat video sampel' }));
    throw new Error(errorData.error || 'Gagal membuat video sampel');
  }

  return res.json();
}

export async function startCompression(
  filePath: string,
  options: CompressionOptions
): Promise<string> {
  const res = await fetch('/api/compress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filePath, options }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Gagal memulai kompresi' }));
    throw new Error(errorData.error || 'Gagal memulai kompresi video');
  }

  const data = await res.json();
  return data.jobId;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function getJobStatus(jobId: string): Promise<CompressionJobResponse> {
  const res = await fetch(`/api/status/${jobId}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      errorData.error ||
      (res.status === 404
        ? 'Pekerjaan tidak ditemukan atau sesi telah berakhir.'
        : 'Gagal mengambil status kompresi.');
    throw new ApiError(message, res.status);
  }
  return res.json();
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatBitrate(bps: number): string {
  if (!bps || bps === 0) return '0 kbps';
  if (bps >= 1000000) {
    return `${(bps / 1000000).toFixed(2)} Mbps`;
  }
  return `${Math.round(bps / 1000)} kbps`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00';
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
