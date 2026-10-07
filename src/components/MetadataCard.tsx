import React from 'react';
import { VideoMetadata } from '../types/video.ts';
import { formatBytes, formatBitrate, formatDuration } from '../services/apiClient.ts';
import { FileVideo, Clock, HardDrive, Cpu, RefreshCw, Disc } from 'lucide-react';

interface MetadataCardProps {
  filename: string;
  metadata: VideoMetadata;
  onReset: () => void;
  disabled?: boolean;
}

export const MetadataCard: React.FC<MetadataCardProps> = ({
  filename,
  metadata,
  onReset,
  disabled = false,
}) => {
  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-3">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
            <FileVideo className="w-5 h-5 text-neutral-300" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-neutral-200 truncate">{filename}</h3>
            <p className="text-xs text-neutral-400">
              Format: <span className="font-mono text-neutral-300">{metadata.codec.toUpperCase()}</span>
              {metadata.audioCodec ? ` / ${metadata.audioCodec.toUpperCase()}` : ''}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Ganti Berkas</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
        <div className="bg-neutral-950/50 border border-neutral-800/80 rounded p-3">
          <div className="flex items-center space-x-1.5 text-[11px] text-neutral-400 mb-1">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Ukuran</span>
          </div>
          <div className="text-base font-semibold text-neutral-100 font-mono">
            {formatBytes(metadata.size)}
          </div>
        </div>

        <div className="bg-neutral-950/50 border border-neutral-800/80 rounded p-3">
          <div className="flex items-center space-x-1.5 text-[11px] text-neutral-400 mb-1">
            <Cpu className="w-3.5 h-3.5" />
            <span>Resolusi</span>
          </div>
          <div className="text-base font-semibold text-neutral-100 font-mono">
            {metadata.width}x{metadata.height}
            <span className="text-xs text-neutral-400 font-normal ml-1">@{metadata.fps}fps</span>
          </div>
        </div>

        <div className="bg-neutral-950/50 border border-neutral-800/80 rounded p-3">
          <div className="flex items-center space-x-1.5 text-[11px] text-neutral-400 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Durasi</span>
          </div>
          <div className="text-base font-semibold text-neutral-100 font-mono">
            {formatDuration(metadata.duration)}
          </div>
        </div>

        <div className="bg-neutral-950/50 border border-neutral-800/80 rounded p-3">
          <div className="flex items-center space-x-1.5 text-[11px] text-neutral-400 mb-1">
            <Disc className="w-3.5 h-3.5" />
            <span>Bitrate</span>
          </div>
          <div className="text-base font-semibold text-neutral-100 font-mono">
            {formatBitrate(metadata.bitrate)}
          </div>
        </div>
      </div>
    </div>
  );
};
