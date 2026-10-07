import React, { useRef, useState } from 'react';
import { UploadCloud, Film, PlayCircle, Loader2 } from 'lucide-react';

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  onUseSample: () => void;
  isLoading: boolean;
  loadingMessage?: string;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileSelected,
  onUseSample,
  isLoading,
  loadingMessage,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/') || /\.(mp4|mov|mkv|webm|avi|m4v)$/i.test(file.name)) {
        onFileSelected(file);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-8 sm:p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-neutral-400 bg-neutral-900/60'
            : 'border-neutral-800 bg-neutral-900/20 hover:border-neutral-700 hover:bg-neutral-900/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mkv,.mp4,.mov,.webm,.avi"
          className="hidden"
          onChange={handleInputChange}
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-6">
            <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
            <p className="text-sm font-medium text-neutral-200">
              {loadingMessage || 'Memeriksa berkas video...'}
            </p>
            <p className="text-xs text-neutral-500">
              Membaca durasi, dimensi, dan bitrate berkas.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-neutral-300">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-neutral-200">
                Pilih atau seret berkas video ke area ini
              </p>
              <p className="text-xs text-neutral-500">
                Format didukung: MP4, MKV, MOV, WebM (Maksimal 1 GB)
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-3.5 py-1.5 text-xs font-medium rounded bg-neutral-200 hover:bg-neutral-100 text-neutral-950 transition-colors shadow-sm"
              >
                Pilih Berkas
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUseSample();
                }}
                className="px-3.5 py-1.5 text-xs font-medium rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 transition-colors flex items-center space-x-1.5"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Gunakan Video Sampel</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500 px-1">
        <span className="flex items-center space-x-1">
          <Film className="w-3 h-3 text-neutral-500" />
          <span>Analisis metadata video otomatis</span>
        </span>
        <span>Pemrosesan lokal pada sistem terisolasi</span>
      </div>
    </div>
  );
};
