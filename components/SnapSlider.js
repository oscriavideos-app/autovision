'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';

/**
 * Magnetic snap slider. The thumb can be dragged freely but always snaps to
 * the nearest angle with a springy micro-bounce. A neon line tracks the thumb
 * to show current status.
 */
export default function SnapSlider({ labels = [], value = 0, onChange }) {
  const trackRef = useRef(null);
  const [width, setWidth] = useState(0);
  const x = useMotionValue(0);
  const draggingRef = useRef(false);
  const count = labels.length;
  const step = count > 1 ? width / (count - 1) : 0;

  // Neon status line width follows the thumb.
  const lineWidth = useTransform(x, (v) => Math.max(0, v) + 2);

  useEffect(() => {
    const measure = () => setWidth(trackRef.current?.offsetWidth || 0);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Keep the thumb parked on the active value when not actively dragging.
  useEffect(() => {
    if (draggingRef.current || step === 0) return;
    const controls = animate(x, value * step, {
      type: 'spring',
      stiffness: 520,
      damping: 17, // low damping => visible micro-bounce
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, step]);

  const snapTo = (idx) => {
    const clamped = Math.max(0, Math.min(count - 1, idx));
    animate(x, clamped * step, { type: 'spring', stiffness: 520, damping: 15 });
    if (clamped !== value) onChange?.(clamped);
  };

  const handleDragEnd = () => {
    draggingRef.current = false;
    snapTo(Math.round(x.get() / step));
  };

  return (
    <div className="w-full select-none">
      <div className="relative h-12" ref={trackRef}>
        {/* Base track */}
        <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/10" />
        {/* Neon status line */}
        <motion.div
          className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-neon shadow-neon"
          style={{ width: lineWidth }}
        />

        {/* Snap notches */}
        {labels.map((label, i) => (
          <button
            key={label.deg ?? i}
            type="button"
            onClick={() => snapTo(i)}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: step * i }}
            aria-label={`Ângulo ${label.deg ?? i}`}
          >
            <span
              className={`block h-3 w-3 rounded-full border transition-colors ${
                i === value
                  ? 'border-neon bg-neon shadow-neon'
                  : 'border-white/30 bg-void'
              }`}
            />
          </button>
        ))}

        {/* Draggable thumb */}
        {step > 0 && (
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: step * (count - 1) }}
            dragElastic={0.12}
            dragMomentum={false}
            onDragStart={() => {
              draggingRef.current = true;
            }}
            onDragEnd={handleDragEnd}
            style={{ x }}
            className="absolute top-1/2 -ml-4 -translate-y-1/2 cursor-grab active:cursor-grabbing"
            whileTap={{ scale: 1.15 }}
          >
            <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-neon bg-void shadow-neon">
              <span className="h-2.5 w-2.5 rounded-full bg-neon" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Labels row */}
      <div className="mt-1 flex justify-between">
        {labels.map((label, i) => (
          <div
            key={`lbl-${label.deg ?? i}`}
            className={`flex-1 text-center font-display text-[11px] tracking-wider transition-colors ${
              i === value ? 'text-neon text-glow' : 'text-white/35'
            }`}
          >
            <div>{label.label}</div>
            <div className="text-[10px] text-white/25">{label.deg}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
