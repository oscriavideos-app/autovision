'use client';

import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';

export default function ShareButton({ imageUrl, prompt }) {
  const handleShare = () => {
    if (!imageUrl) return;
    const text = [
      '🚗 Meu carro criado no *Auto Vision*!',
      prompt ? `\n"${prompt}"` : '',
      `\n\nVeja o render 360°: ${imageUrl}`,
    ].join('');
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.button
      type="button"
      onClick={handleShare}
      disabled={!imageUrl}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="inline-flex items-center gap-2 rounded-full border border-neon/50 bg-neon/10 px-5 py-2.5 font-display text-sm tracking-wide text-neon shadow-neon transition-colors hover:bg-neon/20 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Share2 className="h-4 w-4" />
      Compartilhar no WhatsApp
    </motion.button>
  );
}
