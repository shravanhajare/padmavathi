'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { LogoMark } from '@/components/ui/Logo';

/** Set after the first page has mounted, so only client-side navigations get the curtain. */
let navigated = false;

/**
 * Route transition. Every navigation re-mounts this template: a honey wood
 * curtain carrying the lotus mark lifts away while the page rises in.
 */
export default function Template({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const [curtain] = useState(() => navigated);
  useEffect(() => {
    navigated = true;
  }, []);

  return (
    <>
      {curtain && !reduce && (
        <motion.div
          aria-hidden="true"
          className="wood-grain pointer-events-none fixed inset-0 z-[96] grid place-items-center bg-[linear-gradient(160deg,#e2a867,#c68642_45%,#a0522d)]"
          initial={{ y: '0%' }}
          animate={{ y: '-105%' }}
          transition={{ duration: 0.85, delay: 0.1, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.span initial={{ scale: 1, opacity: 1 }} animate={{ scale: 0.7, opacity: 0 }} transition={{ duration: 0.4 }}>
            <LogoMark className="h-20 w-20 drop-shadow-lg" />
          </motion.span>
          <span className="absolute inset-x-0 bottom-0 h-3 bg-[linear-gradient(90deg,#3f7a5a,#facc15,#3f7a5a)]" />
        </motion.div>
      )}
      <motion.div
        initial={curtain ? { opacity: 0, y: 24 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: curtain ? 0.35 : 0, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </>
  );
}
