import React from 'react';
import { Loader2, Cpu, Activity, Gauge } from 'lucide-react';

interface CompressionProgressProps {
  progress: number;
  currentFps?: number;
  speed?: string;
  status: string;
}

export const CompressionProgress: React.FC<CompressionProgressProps> = ({
  progress,
  currentFps,
  speed,
  status,
}) => {
  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-neutral-200 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-100">
              Memproses Video
            </h3>
            <p className="text-xs text-neutral-400">
              Menjalankan kompresi dan penajaman video.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          {currentFps && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
              <Cpu className="w-3.5 h-3.5 text-neutral-400" />
              <span>{Math.round(currentFps)} FPS</span>
            </div>
          )}
          {speed && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
              <Gauge className="w-3.5 h-3.5 text-neutral-400" />
              <span>Kecepatan: {speed}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar & Numerical Value */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-neutral-300 flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-neutral-400" />
            <span>Kemajuan</span>
          </span>
          <span className="font-mono font-semibold text-neutral-100 text-sm">
            {progress}%
          </span>
        </div>

        <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
          <div
            className="h-full bg-neutral-200 transition-all duration-300 ease-out"
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>
      </div>

      {/* Real-time Technical Stages */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
        <div
          className={`p-2.5 rounded border text-[11px] ${
            progress > 10
              ? 'bg-neutral-950 border-neutral-700 text-neutral-200'
              : 'bg-neutral-950/40 border-neutral-800/80 text-neutral-500'
          }`}
        >
          <div className="font-semibold mb-0.5">1. Analisis Frame</div>
          <div className="text-[10px] text-neutral-400">Pemeriksaan struktur</div>
        </div>

        <div
          className={`p-2.5 rounded border text-[11px] ${
            progress > 35
              ? 'bg-neutral-950 border-neutral-700 text-neutral-200'
              : 'bg-neutral-950/40 border-neutral-800/80 text-neutral-500'
          }`}
        >
          <div className="font-semibold mb-0.5">2. Penajaman Kontur</div>
          <div className="text-[10px] text-neutral-400">Peningkatan detail</div>
        </div>

        <div
          className={`p-2.5 rounded border text-[11px] ${
            progress > 65
              ? 'bg-neutral-950 border-neutral-700 text-neutral-200'
              : 'bg-neutral-950/40 border-neutral-800/80 text-neutral-500'
          }`}
        >
          <div className="font-semibold mb-0.5">3. Pengodean Video</div>
          <div className="text-[10px] text-neutral-400">Optimasi ukuran</div>
        </div>

        <div
          className={`p-2.5 rounded border text-[11px] ${
            progress >= 95
              ? 'bg-neutral-950 border-neutral-700 text-neutral-200'
              : 'bg-neutral-950/40 border-neutral-800/80 text-neutral-500'
          }`}
        >
          <div className="font-semibold mb-0.5">4. Finalisasi</div>
          <div className="text-[10px] text-neutral-400">Penyimpanan berkas</div>
        </div>
      </div>
    </div>
  );
};
