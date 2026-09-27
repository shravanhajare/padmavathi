'use client';

import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion';
import { useT } from '@/i18n/client';
import { X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/lib/useFocusTrap';
import { lockScroll, unlockScroll } from '@/lib/scroll';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  className?: string;
  /** 'center' dialog on desktop that becomes a bottom sheet on mobile, or a right 'drawer'. */
  variant?: 'center' | 'drawer';
}

export function Modal({ open, onClose, labelledBy, children, className, variant = 'center' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const drag = useDragControls();
  useEffect(() => setMounted(true), []);
  useFocusTrap(ref, open, onClose);
  useEffect(() => {
    if (!open) return;
    lockScroll();
    return () => unlockScroll();
  }, [open]);

  if (!mounted) return null;
  const drawer = variant === 'drawer';
  // the bottom sheet (phones) can be pulled down to dismiss from its grab handle
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 700) onClose();
  };
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={cn('fixed inset-0 z-[80] flex', drawer ? 'justify-end' : 'items-end justify-center sm:items-center sm:p-6')}>
          <motion.div
            className="absolute inset-0 bg-[#1c120b]/45 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            data-lenis-prevent
            className={cn(
              'relative z-10 flex max-h-[100svh] flex-col overflow-hidden bg-surface text-fg shadow-[0_30px_80px_-20px_rgb(0_0_0/0.45)] outline-none',
              drawer
                ? 'h-[100svh] w-full max-w-[28rem] border-l border-line'
                : 'max-h-[92svh] w-full rounded-t-[2rem] border border-line sm:max-w-5xl sm:rounded-[2rem]',
              className,
            )}
            initial={drawer ? { x: '100%' } : { y: 60, opacity: 0, scale: 0.98 }}
            animate={drawer ? { x: 0 } : { y: 0, opacity: 1, scale: 1 }}
            exit={drawer ? { x: '100%' } : { y: 40, opacity: 0, scale: 0.98 }}
            transition={drawer ? { type: 'spring', stiffness: 320, damping: 34 } : { duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            drag={drawer ? false : 'y'}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={onDragEnd}
          >
            {!drawer && (
              <div
                className="absolute inset-x-0 top-0 z-30 flex h-7 touch-none justify-center pt-2 sm:hidden"
                onPointerDown={(e) => drag.start(e)}
                aria-hidden="true"
              >
                <span className="h-1.5 w-11 rounded-full bg-[#2e1d12]/25 dark:bg-white/30" />
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function CloseButton({ onClick, label, className }: { onClick: () => void; label?: string; className?: string }) {
  const t = useT();
  label ??= t.common.close;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-surface/80 text-fg backdrop-blur transition-all hover:rotate-90 hover:border-honey',
        className,
      )}
    >
      <X size={18} />
    </button>
  );
}
