import { ButtonLink } from '@/components/ui/Button';
import { Kolam, WoodShaving } from '@/components/ui/Kolam';

export default function NotFound() {
  return (
    <section className="relative grid min-h-[80vh] place-items-center overflow-hidden px-4 pt-28 text-center">
      <Kolam className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 text-honey/20" spin />
      <div className="relative flex flex-col items-center gap-5">
        <WoodShaving className="h-16 w-20 animate-sway" />
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-wood">404</p>
        <h1 className="text-5xl font-semibold text-fg sm:text-6xl">This page rolled away</h1>
        <p className="max-w-md text-muted">We couldn’t find what you were looking for. The belans, spoons and scrapers are all still in the shop.</p>
        <ButtonLink href="/#shop" size="lg" magnetic>
          Back to the shop
        </ButtonLink>
      </div>
    </section>
  );
}
