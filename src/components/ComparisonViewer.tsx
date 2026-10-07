import React, { useRef, useState, useEffect } from 'react';
import { VideoMetadata } from '../types/video.ts';
import { formatBytes, formatBitrate, formatDuration } from '../services/apiClient.ts';
import {
  Download,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Layers,
  ArrowDownRight,
  TrendingDown,
} from 'lucide-react';

interface ComparisonViewerProps {
  jobId: string;
  originalMeta: VideoMetadata;
  outputMeta: VideoMetadata;
  onReset: () => void;
}

export const ComparisonViewer: React.FC<ComparisonViewerProps> = ({
  jobId,
  originalMeta,
  outputMeta,
  onReset,
}) => {
  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const compressedVideoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(originalMeta.duration || 0);
  const [zoomLevel, setZoomLevel] = useState<1 | 1.5 | 2>(1);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'split'>('side-by-side');
  const [splitPos, setSplitPos] = useState(50); // percentage for split view

  const originalSrc = `/api/stream/original/${jobId}`;
  const compressedSrc = `/api/stream/compressed/${jobId}`;

  const savedBytes = Math.max(0, originalMeta.size - outputMeta.size);
  const savedPercent = originalMeta.size > 0 ? Math.round((savedBytes / originalMeta.size) * 100) : 0;
  const compressionRatio = outputMeta.size > 0 ? (originalMeta.size / outputMeta.size).toFixed(1) : '1.0';

  // Synchronized playback controls
  const togglePlay = () => {
    if (isPlaying) {
      originalVideoRef.current?.pause();
      compressedVideoRef.current?.pause();
      setIsPlaying(false);
    } else {
      originalVideoRef.current?.play();
      compressedVideoRef.current?.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (originalVideoRef.current) originalVideoRef.current.muted = nextMuted;
    if (compressedVideoRef.current) compressedVideoRef.current.muted = nextMuted;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (originalVideoRef.current) originalVideoRef.current.currentTime = time;
    if (compressedVideoRef.current) compressedVideoRef.current.currentTime = time;
  };

  const handleTimeUpdate = () => {
    if (compressedVideoRef.current) {
      setCurrentTime(compressedVideoRef.current.currentTime);
      if (compressedVideoRef.current.duration) {
        setDuration(compressedVideoRef.current.duration);
      }
    }
  };

  const handleRestart = () => {
    if (originalVideoRef.current) originalVideoRef.current.currentTime = 0;
    if (compressedVideoRef.current) compressedVideoRef.current.currentTime = 0;
    setCurrentTime(0);
  };

  // Sync seeking between videos
  useEffect(() => {
    const original = originalVideoRef.current;
    const compressed = compressedVideoRef.current;

    const syncPlayback = () => {
      if (compressed && original && Math.abs(original.currentTime - compressed.currentTime) > 0.15) {
        original.currentTime = compressed.currentTime;
      }
    };

    compressed?.addEventListener('timeupdate', syncPlayback);
    return () => {
      compressed?.removeEventListener('timeupdate', syncPlayback);
    };
  }, []);

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-5 space-y-6">
      {/* Header Metric Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-neutral-800 text-neutral-200">
              <CheckCircle2 className="w-4 h-4 text-neutral-200" />
            </span>
            <h3 className="text-base font-semibold text-neutral-100">
              Hasil Kompresi Selesai
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Video telah dikompresi dengan optimasi ketajaman dan efisiensi ukuran.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-1.5 text-xs font-medium rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 transition-colors cursor-pointer"
          >
            Kompres Berkas Lain
          </button>
          <a
            href={`/api/download/${jobId}`}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-950 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Video</span>
          </a>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-3.5">
          <span className="text-[11px] text-neutral-400 block mb-1">Perbandingan Ukuran</span>
          <div className="text-sm font-semibold font-mono text-neutral-200 flex items-center space-x-1.5">
            <span className="line-through text-neutral-500">{formatBytes(originalMeta.size)}</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-100">{formatBytes(outputMeta.size)}</span>
          </div>
        </div>

        <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-3.5">
          <span className="text-[11px] text-neutral-400 block mb-1">Pengurangan Ukuran</span>
          <div className="text-base font-bold font-mono text-neutral-100 flex items-center space-x-1">
            <TrendingDown className="w-4 h-4 text-neutral-300" />
            <span>-{savedPercent}% MB</span>
          </div>
        </div>

        <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-3.5">
          <span className="text-[11px] text-neutral-400 block mb-1">Rasio Kompresi</span>
          <div className="text-base font-semibold font-mono text-neutral-100">
            {compressionRatio}x Lebih Kecil
          </div>
        </div>

        <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-3.5">
          <span className="text-[11px] text-neutral-400 block mb-1">Bitrate Akhir</span>
          <div className="text-sm font-semibold font-mono text-neutral-300">
            {formatBitrate(outputMeta.bitrate)}
          </div>
        </div>
      </div>

      {/* Video Viewport Header Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-neutral-400 font-medium">Tampilan:</span>
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`px-2.5 py-1 rounded border text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'side-by-side'
                ? 'bg-neutral-800 border-neutral-600 text-neutral-100'
                : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Berdampingan
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 rounded border text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'split'
                ? 'bg-neutral-800 border-neutral-600 text-neutral-100'
                : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Layar Geser
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-neutral-400 font-medium">Perbesaran:</span>
          <div className="flex items-center border border-neutral-800 rounded bg-neutral-950/60 p-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                zoomLevel === 1 ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400'
              }`}
            >
              1.0x
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1.5)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                zoomLevel === 1.5 ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400'
              }`}
            >
              1.5x
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(2)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                zoomLevel === 2 ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400'
              }`}
            >
              2.0x
            </button>
          </div>
        </div>
      </div>

      {/* Video Players Container */}
      {viewMode === 'side-by-side' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Original Viewport */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
              <span className="font-semibold text-neutral-300">Video Asli</span>
              <span className="font-mono">{formatBytes(originalMeta.size)}</span>
            </div>
            <div className="relative aspect-video bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800 flex items-center justify-center">
              <video
                ref={originalVideoRef}
                src={originalSrc}
                playsInline
                muted={isMuted}
                className="w-full h-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-neutral-900/90 border border-neutral-700 text-[10px] font-mono text-neutral-300">
                ASLI
              </span>
            </div>
          </div>

          {/* Compressed Viewport */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
              <span className="font-semibold text-neutral-200">
                Hasil Kompresi
              </span>
              <span className="font-mono text-neutral-200 font-semibold">
                {formatBytes(outputMeta.size)} (-{savedPercent}%)
              </span>
            </div>
            <div className="relative aspect-video bg-neutral-950 rounded-lg overflow-hidden border border-neutral-700 flex items-center justify-center">
              <video
                ref={compressedVideoRef}
                src={compressedSrc}
                playsInline
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-neutral-900/90 border border-neutral-600 text-[10px] font-mono text-neutral-100">
                HASIL KOMPRESI
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Split-Screen Slider Viewport */
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
            <span>Kiri: Video Asli ({formatBytes(originalMeta.size)})</span>
            <span className="text-neutral-200 font-semibold">
              Kanan: Hasil Kompresi ({formatBytes(outputMeta.size)})
            </span>
          </div>

          <div className="relative aspect-video bg-neutral-950 rounded-lg overflow-hidden border border-neutral-700 select-none">
            {/* Compressed Layer (Base) */}
            <video
              ref={compressedVideoRef}
              src={compressedSrc}
              playsInline
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{ transform: `scale(${zoomLevel})` }}
            />

            {/* Original Layer (Clipped to splitPos) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
            >
              <video
                ref={originalVideoRef}
                src={originalSrc}
                playsInline
                muted={isMuted}
                className="w-full h-full object-contain"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            </div>

            {/* Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-neutral-200 shadow-md cursor-ew-resize z-10"
              style={{ left: `${splitPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 rounded-full bg-neutral-100 border border-neutral-700 flex items-center justify-center text-neutral-950 shadow-lg text-[10px] font-bold">
                |
              </div>
            </div>

            {/* Split Slider Controller */}
            <input
              type="range"
              min="0"
              max="100"
              value={splitPos}
              onChange={(e) => setSplitPos(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
            />

            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-neutral-950/80 border border-neutral-800 text-[10px] font-mono text-neutral-400 pointer-events-none">
              ASLI (KIRI)
            </span>
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-neutral-950/80 border border-neutral-800 text-[10px] font-mono text-neutral-200 pointer-events-none">
              KOMPRESI (KANAN)
            </span>
          </div>
        </div>
      )}

      {/* Global Synchronized Playback Control Bar */}
      <div className="bg-neutral-950/70 border border-neutral-800 rounded-lg p-3 space-y-2">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={togglePlay}
            className="w-8 h-8 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-950 flex items-center justify-center transition-colors shrink-0"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="w-8 h-8 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center justify-center transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="w-8 h-8 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center justify-center transition-colors shrink-0"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Scrubber slider */}
          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-neutral-200 bg-neutral-800 h-1.5 rounded cursor-pointer"
          />

          <div className="text-xs font-mono text-neutral-400 shrink-0">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </div>
        </div>
      </div>
    </div>
  );
};
