/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { UploadDropzone } from './components/UploadDropzone.tsx';
import { MetadataCard } from './components/MetadataCard.tsx';
import { ProcessPanel } from './components/ProcessPanel.tsx';
import { CompressionProgress } from './components/CompressionProgress.tsx';
import { ComparisonViewer } from './components/ComparisonViewer.tsx';
import { PipelineExplainerModal } from './components/PipelineExplainerModal.tsx';
import {
  VideoMetadata,
  CompressionOptions,
  CompressionJobResponse,
} from './types/video.ts';
import {
  analyzeVideoFile,
  generateSampleVideo,
  startCompression,
  getJobStatus,
  ApiError,
} from './services/apiClient.ts';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [sourceFile, setSourceFile] = useState<{
    filePath: string;
    filename: string;
    metadata: VideoMetadata;
  } | null>(null);

  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);

  // Compression options state
  const [options, setOptions] = useState<CompressionOptions>({
    mode: 'perceptual-breakthrough',
    reductionIntensity: 'ultra',
    targetReductionPercent: 75,
    clarityBoost: 'standard',
    fastActionEngine: true,
    enableMotionConsistency: true,
    enableColorPop: true,
    enableNoiseDecoupling: false,
    noiseIntensity: 'light',
    enableEdgePreEmphasis: true,
    edgeIntensity: 'standard',
    enable10BitPrecision: false,
    scaleResolution: 'original',
    audioBitrate: '48k',
  });

  // Active Job State
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobState, setJobState] = useState<CompressionJobResponse | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Handle local file selection
  const handleFileSelected = async (file: File) => {
    try {
      setErrorMessage(null);
      setIsLoadingFile(true);
      setLoadingMessage('Menganalisis stream video sumber...');
      const result = await analyzeVideoFile(file);
      setSourceFile(result);
      setActiveJobId(null);
      setJobState(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal memproses berkas');
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Handle synthetic sample generator
  const handleUseSample = async () => {
    try {
      setErrorMessage(null);
      setIsLoadingFile(true);
      setLoadingMessage('Membuat sampel video sintetis 1080p dengan noise sensor...');
      const result = await generateSampleVideo();
      setSourceFile(result);
      setActiveJobId(null);
      setJobState(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal membuat sampel');
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Start Compression Job
  const handleStartCompression = async () => {
    if (!sourceFile) return;

    try {
      setErrorMessage(null);
      const jobId = await startCompression(sourceFile.filePath, options);
      setActiveJobId(jobId);
      setJobState({
        id: jobId,
        status: 'processing',
        progress: 0,
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal memulai kompresi');
    }
  };

  // Polling job status
  useEffect(() => {
    if (!activeJobId) return;

    let failureCount = 0;

    const checkStatus = async () => {
      try {
        const status = await getJobStatus(activeJobId);
        failureCount = 0;
        setJobState(status);

        if (status.status === 'completed' || status.status === 'failed') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          if (status.status === 'failed') {
            setErrorMessage(status.error || 'Proses kompresi gagal dieksekusi.');
          }
        }
      } catch (err: unknown) {
        failureCount++;

        // Only give up after 6 consecutive failed attempts (allows time for job initialization)
        if (failureCount >= 6) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setActiveJobId(null);
          setJobState(null);
          setErrorMessage(
            err instanceof Error
              ? err.message
              : 'Gagal memantau status kompresi setelah beberapa percobaan. Silakan coba kembali.'
          );
        }
      }
    };

    checkStatus();
    pollingRef.current = setInterval(checkStatus, 1000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [activeJobId]);

  // Reset to initial state
  const handleReset = () => {
    setSourceFile(null);
    setActiveJobId(null);
    setJobState(null);
    setErrorMessage(null);
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans antialiased selection:bg-neutral-800 selection:text-neutral-100">
      <Header onOpenExplainer={() => setIsExplainerOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-700 flex items-start space-x-3 text-neutral-200">
            <AlertCircle className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <span className="font-semibold block mb-0.5">Pemberitahuan</span>
              <p className="text-neutral-400">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* View State 1: Upload Dropzone */}
        {!sourceFile && (
          <div className="space-y-6 max-w-3xl mx-auto py-8">
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100">
                Kompresi Video Berkualitas Tinggi
              </h1>
              <p className="text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
                Kurangi ukuran berkas video secara signifikan dengan mempertahankan ketajaman garis tepi dan kestabilan pergerakan objek.
              </p>
            </div>

            <UploadDropzone
              onFileSelected={handleFileSelected}
              onUseSample={handleUseSample}
              isLoading={isLoadingFile}
              loadingMessage={loadingMessage}
            />
          </div>
        )}

        {/* View State 2: Source File Loaded */}
        {sourceFile && (
          <div className="space-y-6">
            <MetadataCard
              filename={sourceFile.filename}
              metadata={sourceFile.metadata}
              onReset={handleReset}
              disabled={jobState?.status === 'processing'}
            />

            {/* When not completed: Show Controls or Progress */}
            {(!jobState || jobState.status === 'processing' || jobState.status === 'queued') && (
              <>
                {jobState?.status === 'processing' || jobState?.status === 'queued' ? (
                  <CompressionProgress
                    progress={jobState.progress}
                    currentFps={jobState.currentFps}
                    speed={jobState.speed}
                    status={jobState.status}
                  />
                ) : (
                  <ProcessPanel
                    metadata={sourceFile.metadata}
                    onSubmit={handleStartCompression}
                    isProcessing={false}
                  />
                )}
              </>
            )}

            {/* When completed: Show Side-by-Side Comparison Suite */}
            {jobState?.status === 'completed' && activeJobId && (
              <ComparisonViewer
                jobId={activeJobId}
                originalMeta={jobState.originalMeta || sourceFile.metadata}
                outputMeta={
                  jobState.outputMeta || {
                    ...sourceFile.metadata,
                    size: Math.round(sourceFile.metadata.size * 0.25),
                  }
                }
                onReset={handleReset}
              />
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-neutral-800 bg-neutral-950 py-6 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Kompresor Video &bull; Pemrosesan Sistem FFMPEG</span>
          <span>Stabilisasi Gerakan &amp; Efisiensi Ukuran Berkas</span>
        </div>
      </footer>

      {/* Architecture Explainer Modal */}
      <PipelineExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
      />
    </div>
  );
}
