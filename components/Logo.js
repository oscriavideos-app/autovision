'use client';

import { motion } from 'framer-motion';

export default function Logo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="flex items-center gap-3 select-none"
    >
      <div className="relative grid h-10 w-10 place-items-center">
        <span className="absolute inset-0 rounded-lg border border-neon/40 shadow-neon" />
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-neon" fill="none">
          <path
            d="M2 12h4l2-4h8l2 4h4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="7" cy="15" r="2.2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="17" cy="15" r="2.2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </div>
      <div className="leading-none">
        <span className="font-display text-lg font-black tracking-[0.25em] text-white text-glow">
          AUTO
        </span>
        <span className="font-display text-lg font-black tracking-[0.25em] text-neon text-glow">
          VISION
        </span>
        <p className="mt-1 font-body text-[10px] uppercase tracking-[0.4em] text-neon/50">
          AI Photo Studio
        </p>
      </div>
    </motion.div>
  );
}
