'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Download } from 'lucide-react';
import SnapSlider from './SnapSlider';
import ShareButton from './ShareButton';

export default function ImageGallery({ images, active, onActiveChange, prompt }) {
  const current = images[active] || images[0];
  const labels = images.map((img) => ({ label: img.label, deg: img.deg }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Stage */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-neon/20 bg-panel shadow-neon">
        <div className="bg-grid absolute inset-0 opacity-40" />

        <AnimatePresence mode="wait">
          <motion.img
            key={current?.url}
            src={current?.url}
            alt={`Render do carro — ${current?.label}`}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>

        {/* Angle badge */}
        <div className="absolute left-4 top-4 rounded-full border border-neon/40 bg-void/70 px-3 py-1 font-display text-xs tracking-widest text-neon backdrop-blur">
          {current?.label} · {current?.deg}
        </div>

        {/* Download */}
        <a
          href={current?.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-void/70 text-white/80 backdrop-blur transition-colors hover:text-neon"
          aria-label="Abrir imagem em nova aba"
        >
          <Download className="h-4 w-4" />
        </a>
      </div>

      {/* Snap slider */}
      <div className="mt-6 px-1">
        <SnapSlider labels={labels} value={active} onChange={onActiveChange} />
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <ShareButton imageUrl={current?.url} prompt={prompt} />
      </div>
    </motion.div>
  );
}
