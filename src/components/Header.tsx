import React from 'react';
import { Layers, ShieldCheck, Info } from 'lucide-react';

interface HeaderProps {
  onOpenExplainer: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenExplainer }) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950/90 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center text-neutral-200">
            <Layers className="w-5 h-5 text-neutral-200" />
          </div>
          <div>
            <span className="font-semibold text-neutral-100 tracking-tight text-sm sm:text-base">
              Kompresor Video
            </span>
            <p className="text-xs text-neutral-400 hidden sm:block">
              Optimalisasi ukuran dan ketajaman video
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenExplainer}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Informasi Teknis</span>
          </button>
        </div>
      </div>
    </header>
  );
};
