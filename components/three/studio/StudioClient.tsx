'use client';

import { useEffect, useRef, useState } from 'react';
import { products } from '@/data/products';
import type { ModelSpec } from '@/data/types';
import { ProductRenderer } from './productRenderer';

declare global {
  interface Window {
    __peStudio?: {
      ready: boolean;
      ids: string[];
      render: (id: string) => Promise<string>;
      renderSpec: (spec: ModelSpec, opts?: Parameters<ProductRenderer['render']>[1]) => string;
    };
  }
}

/**
 * The model test scene: renders every catalogue item with the procedural
 * models so they can be inspected here, and captured to
 * /public/images/products by `npm run render:products`.
 * `?single=1` shows each piece on its own, without props.
 */
export default function StudioClient() {
  const rendererRef = useRef<ProductRenderer | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('Preparing fonts…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await document.fonts.ready;
      const r = new ProductRenderer(900);
      rendererRef.current = r;
      const params = new URLSearchParams(window.location.search);
      const single = params.has('single');
      const renderOne = async (id: string) => {
        const p = products.find((x) => x.id === id);
        if (!p) throw new Error(`Unknown product ${id}`);
        return r.render(p.model, { single: single && !['chaklaBelan', 'utensilSet', 'giftSet'].includes(p.model.kind) });
      };
      window.__peStudio = { ready: true, ids: products.map((p) => p.id), render: renderOne, renderSpec: (spec, opts) => r.render(spec, opts) };
      if (params.has('capture')) {
        setStatus('Capture mode: waiting for the render script.');
        return;
      }
      const only = params.get('only')?.split(',');
      for (const p of products) {
        if (cancelled) return;
        if (only && !only.includes(p.id)) continue;
        setStatus(`Rendering ${p.name}…`);
        await new Promise((res) => requestAnimationFrame(res));
        const url = await renderOne(p.id);
        setImages((prev) => ({ ...prev, [p.id]: url }));
      }
      setStatus(`Rendered ${only?.length ?? products.length} products.`);
    })();
    return () => {
      cancelled = true;
      rendererRef.current?.dispose();
    };
  }, []);

  return (
    <div className="container-page pb-24 pt-28">
      <h1 className="text-4xl font-semibold">Product render studio</h1>
      <p className="mt-2 text-muted" id="studio-status">
        {status}
      </p>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {products.map((p) => (
            <figure
              key={p.id}
              className="rounded-2xl border border-line bg-[radial-gradient(circle_at_50%_40%,#fff8ea,#f3d9bd)] p-2 dark:bg-[radial-gradient(circle_at_50%_40%,#3a2618,#1a120c)]"
            >
              {images[p.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[p.id]} alt={p.name} className="aspect-square w-full" />
              ) : (
                <div className="skeleton aspect-square w-full rounded-xl" />
              )}
              <figcaption className="mt-1 text-center text-xs text-muted">{p.name}</figcaption>
            </figure>
          ))}
      </div>
    </div>
  );
}
