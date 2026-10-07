export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  size: number; // bytes
  bitrate: number; // bps
  fps: number;
  codec: string;
  audioCodec?: string;
  audioBitrate?: number;
}

export type CompressionMode =
  | 'perceptual-breakthrough'
  | 'target-size'
  | 'balanced'
  | 'extreme-save';

export type ReductionIntensity = 'ultra' | 'aggressive' | 'moderate' | 'custom';
export type ClarityBoostLevel = 'extreme' | 'standard' | 'subtle' | 'off';

export interface CompressionOptions {
  mode: CompressionMode;
  reductionIntensity: ReductionIntensity;
  targetReductionPercent: number; // 30 to 90
  targetSizeMb?: number;
  clarityBoost: ClarityBoostLevel; // FidelityFX CAS + Edge Enhancer
  fastActionEngine?: boolean; // Zero-lag spatial purity + UMH 32px motion search for running/fast action
  enableMotionConsistency: boolean; // qcomp=0.75 + short GOP to prevent mid-video motion blur
  enableColorPop: boolean; // subtle contrast + saturation boost for vivid HD
  enableNoiseDecoupling: boolean;
  noiseIntensity: 'light' | 'medium' | 'strong';
  enableEdgePreEmphasis: boolean;
  edgeIntensity: 'subtle' | 'standard' | 'high';
  enable10BitPrecision: boolean;
  scaleResolution: 'original' | '1080p' | '720p' | '480p';
  audioBitrate: 'original' | '128k' | '96k' | '64k' | '48k';
  crfValue?: number;
}

export interface CompressionJobResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentFps?: number;
  speed?: string;
  error?: string;
  originalMeta?: VideoMetadata;
  outputMeta?: VideoMetadata;
}
