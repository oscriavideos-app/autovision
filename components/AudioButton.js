'use client';

import { motion } from 'framer-motion';
import { Mic, Square, Loader2 } from 'lucide-react';

/**
 * Pulsing audio button. Idle -> pulses gently. Recording -> reacts to voice
 * level. Busy -> shows a spinner and is disabled.
 */
export default function AudioButton({ isRecording, level = 0, busy, onClick }) {
  const scale = isRecording ? 1 + level * 0.35 : 1;

  return (
    <div className="relative grid place-items-center">
      {/* Expanding pulse rings */}
      {!busy && (
        <>
          <span className="pointer-events-none absolute h-24 w-24 rounded-full border border-neon/40 animate-pulseRing" />
          <span
            className="pointer-events-none absolute h-24 w-24 rounded-full border border-neon/30 animate-pulseRing"
            style={{ animationDelay: '1s' }}
          />
        </>
      )}

      <motion.button
        type="button"
        onClick={onClick}
        disabled={busy}
        animate={{ scale }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        whileTap={{ scale: 0.92 }}
        className={`relative grid h-24 w-24 place-items-center rounded-full border-2 font-display transition-colors ${
          isRecording
            ? 'border-neon-amber bg-neon-amber/10 text-neon-amber shadow-neon-amber'
            : 'border-neon bg-neon/10 text-neon shadow-neon'
        } ${busy ? 'cursor-not-allowed opacity-70' : 'hover:bg-neon/20'}`}
        aria-label={isRecording ? 'Parar gravação' : 'Gravar descrição'}
      >
        {busy ? (
          <Loader2 className="h-9 w-9 animate-spin" />
        ) : isRecording ? (
          <Square className="h-8 w-8 fill-current" />
        ) : (
          <Mic className="h-9 w-9" />
        )}
      </motion.button>
    </div>
  );
}
