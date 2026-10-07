import React from 'react';
import { VideoMetadata } from '../types/video.ts';
import { formatBytes } from '../services/apiClient.ts';
import { ArrowRight, SlidersHorizontal, Activity, Eye } from 'lucide-react';

interface ProcessPanelProps {
  metadata: VideoMetadata;
  onSubmit: () => void;
  isProcessing: boolean;
}

export const ProcessPanel: React.FC<ProcessPanelProps> = ({
  metadata,
  onSubmit,
  isProcessing,
}) => {
  const estimatedBytes = Math.round(metadata.size * 0.25);

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-800">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100">
            Pemrosesan Video
          </h3>
          <p className="text-xs text-neutral-400">
            Kompresi ukuran otomatis dengan penajaman tepi dan stabilisasi gerak.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-300 self-start sm:self-auto">
          <span>Estimasi Ukuran: </span>
          <span className="text-neutral-100 font-bold">{formatBytes(estimatedBytes)}</span>
          <span className="text-neutral-400 ml-1">(-75%)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-neutral-950/50 border border-neutral-800/80 space-y-1">
          <div className="flex items-center space-x-1.5 text-xs font-medium text-neutral-200">
            <Eye className="w-3.5 h-3.5 text-neutral-400" />
            <span>Penajaman Kontur</span>
          </div>
          <p className="text-[11px] text-neutral-400">
            Filter ketajaman adaptif untuk mempertahankan detail garis tepi dan teks.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-neutral-950/50 border border-neutral-800/80 space-y-1">
          <div className="flex items-center space-x-1.5 text-xs font-medium text-neutral-200">
            <Activity className="w-3.5 h-3.5 text-neutral-400" />
            <span>Stabilisasi Gerak</span>
          </div>
          <p className="text-[11px] text-neutral-400">
            Pelacakan vektor gerak cepat agar objek bergerak tidak buram.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-neutral-950/50 border border-neutral-800/80 space-y-1">
          <div className="flex items-center space-x-1.5 text-xs font-medium text-neutral-200">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
            <span>Optimasi Bitrate</span>
          </div>
          <p className="text-[11px] text-neutral-400">
            Pembersihan noise dan efisiensi pengodean video serta audio.
          </p>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isProcessing}
          className="w-full py-3 px-4 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-semibold text-sm transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Mulai Kompresi</span>
          <ArrowRight className="w-4 h-4 text-neutral-950" />
        </button>
      </div>
    </div>
  );
};
