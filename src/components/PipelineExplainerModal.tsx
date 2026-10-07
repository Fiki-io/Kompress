import React from 'react';
import { X, Cpu, Layers, Sparkles, ShieldCheck, Check } from 'lucide-react';

interface PipelineExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PipelineExplainerModal: React.FC<PipelineExplainerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center">
              <Layers className="w-4 h-4 text-neutral-200" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100">
                Informasi Teknis Pemrosesan Video
              </h2>
              <p className="text-xs text-neutral-400">
                Penjelasan tahapan filter dan pengodean yang diterapkan pada video
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
          {/* Section 1 */}
          <div className="p-3.5 rounded-lg bg-neutral-950/60 border border-neutral-800 space-y-2">
            <div className="flex items-center space-x-2 text-neutral-100 font-semibold">
              <Sparkles className="w-4 h-4 text-neutral-300" />
              <span>1. Pembersihan Noise Spasial Murni</span>
            </div>
            <p className="text-neutral-400">
              Noise acak sensor kamera dibersihkan secara spasial pada setiap frame tanpa pencampuran antar-waktu. Ini mencegah terjadinya efek bayangan kabur (motion ghosting) saat objek bergerak cepat atau berlari.
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-3.5 rounded-lg bg-neutral-950/60 border border-neutral-800 space-y-2">
            <div className="flex items-center space-x-2 text-neutral-100 font-semibold">
              <Cpu className="w-4 h-4 text-neutral-300" />
              <span>2. Penajaman Kontur Adaptif (AMD FidelityFX CAS)</span>
            </div>
            <p className="text-neutral-400">
              Algoritma Contrast Adaptive Sharpening menganalisis kontras lokal untuk mempertegas garis tepi, teks, dan detail wajah tanpa menambahkan bintik atau artefak cincin di area datar.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-3.5 rounded-lg bg-neutral-950/60 border border-neutral-800 space-y-2">
            <div className="flex items-center space-x-2 text-neutral-100 font-semibold">
              <ShieldCheck className="w-4 h-4 text-neutral-300" />
              <span>3. Pelacakan Gerakan Cepat (UMH 32-Pixel)</span>
            </div>
            <p className="text-neutral-400">
              Radius pencarian vektor gerak diperluas hingga 32 pixel dengan algoritma Uneven Multi-Hexagon, memastikan objek yang bergerak cepat tetap terprediksi secara akurat dan tidak pecah.
            </p>
          </div>

          {/* Summary checklist */}
          <div className="pt-2 border-t border-neutral-800 space-y-2">
            <span className="font-semibold text-neutral-200 block">
              Ringkasan Hasil:
            </span>
            <ul className="space-y-1.5 text-neutral-400">
              <li className="flex items-center space-x-2">
                <Check className="w-3.5 h-3.5 text-neutral-200" />
                <span>Ukuran berkas berkurang rata-rata 70% hingga 80%.</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-3.5 h-3.5 text-neutral-200" />
                <span>Objek bergerak dan berlari tetap tajam tanpa efek blur.</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-3.5 h-3.5 text-neutral-200" />
                <span>Audio efisien dengan format AAC stereo jernih.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-950 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
