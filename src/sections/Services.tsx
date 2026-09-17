import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { site, type Service } from '../config/site';
import { SectionHeader } from '../components/SectionHeader';
import { ServiceArt } from '../components/svg/ServiceArt';
import { useFinePointer } from '../hooks/useFinePointer';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { gsap, useGSAP } from '../motion/motion';

// 4-column bento at ≥1024px: lg (2x2) + three md (2x1) + two sm (1x1) sum to
// exactly 12 cells = a full 4x3 grid with `grid-auto-flow: dense`.
const SIZE_CLASSES: Record<Service['size'], string> = {
  lg: 'sm:col-span-2 lg:col-span-2 lg:row-span-2',
  md: 'sm:col-span-2 lg:col-span-2',
  sm: 'sm:col-span-1 lg:col-span-1',
};

// Watermark drawing size per card size (docs/DESIGN.md §3.6 asks for ~160px;
// the hero card of the bento carries a larger one, the 1x1 cards a smaller).
const ART_SIZE: Record<Service['size'], string> = {
  lg: 'h-40 w-40 sm:h-64 sm:w-64 lg:h-80 lg:w-80',
  md: 'h-32 w-32 sm:h-44 sm:w-44',
  sm: 'h-28 w-28 sm:h-32 sm:w-32',
};

// Text column width + bottom clearance, so copy never collides with the
// watermark drawing at any viewport (asserted in e2e/interactions.spec.ts).
const TEXT_BOX: Record<Service['size'], string> = {
  lg: 'max-w-[38ch] pb-16',
  md: 'max-w-[30ch] pb-4',
  sm: 'max-w-full pb-24',
};

const TITLE_SIZE: Record<Service['size'], string> = {
  lg: 'text-[1.75rem]',
  md: 'text-[1.5rem]',
  sm: 'text-[1.5rem]',
};

// Mono index shown as a drawing callout in each card's top-left corner.
const pad = (n: number) => String(n).padStart(2, '0');

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface ServiceCardProps {
  service: Service;
  index: number;
}

function ServiceCard({ service, index }: ServiceCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const finePointer = useFinePointer();
  const reducedMotion = usePrefersReducedMotion();
  // Tilt + spotlight are continuous pointer-driven motion (BRIEF §5.2 removes
  // this outright under reduced motion), so gate on both conditions, not
  // fine-pointer alone.
  const interactive = finePointer && !reducedMotion;

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const py = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    const rotateY = clamp((px - 0.5) * 12, -6, 6);
    const rotateX = clamp((0.5 - py) * 12, -6, 6);
    card.style.setProperty('--tilt-x', `${rotateX}deg`);
    card.style.setProperty('--tilt-y', `${rotateY}deg`);
    card.style.setProperty('--spot-x', `${px * 100}%`);
    card.style.setProperty('--spot-y', `${py * 100}%`);
  }

  function handlePointerLeave() {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  }

  return (
    <article
      ref={cardRef}
      tabIndex={0}
      data-testid="service-card"
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerLeave={interactive ? handlePointerLeave : undefined}
      className={`service-card card focus-ring relative flex min-h-[13rem] flex-col overflow-hidden p-6 md:p-7 ${SIZE_CLASSES[service.size]}`}
    >
      <span className="spotlight" aria-hidden="true" />

      {/* Dimensional watermark: 25% opacity until the card is hovered or
          focused, then full colour with its own micro-animation. The tilt
          transform is scoped to this absolutely-positioned wrapper, never to
          a percentage-height flex container (a Chromium sizing bug for
          descendant SVGs, see the v1 note in docs/DECISIONS.md). */}
      <div
        aria-hidden="true"
        className={`service-art-wrap tilt-wrapper pointer-events-none absolute bottom-0 right-0 ${ART_SIZE[service.size]}`}
        style={
          interactive
            ? { transform: 'perspective(900px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))' }
            : undefined
        }
      >
        <ServiceArt id={service.id} className="h-full w-full" />
      </div>

      <p aria-hidden="true" className="relative z-[1] font-mono text-xs tracking-[0.18em] text-arc">
        {pad(index + 1)}
      </p>

      <div className={`relative z-[1] mt-6 ${TEXT_BOX[service.size]}`}>
        <h3 className={`display-md text-text ${TITLE_SIZE[service.size]}`}>{service.title}</h3>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{service.description}</p>
      </div>
    </article>
  );
}

/**
 * Asymmetric bento grid of six services (docs/BRIEF.md §6.6): 1 column
 * below 640px, 2 columns from 640px, the full 4-column bento from 1024px.
 * Cards reveal with a stagger on scroll-in (skipped under reduced motion,
 * which renders every card visible up front).
 */
export function Services() {
  const gridRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion) return;
      const cards = gridRef.current?.querySelectorAll<HTMLElement>('.service-card');
      if (!cards || cards.length === 0) return;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: gridRef.current, start: 'top 85%', once: true },
        }
      );
    },
    { dependencies: [reducedMotion], scope: gridRef }
  );

  return (
    <section id="usluge" data-testid="section-services" className="section">
      <div className="container-x">
        <SectionHeader sheet={4} eyebrow={site.services.eyebrow} title={site.services.title} intro={site.services.intro} />

        <div
          ref={gridRef}
          className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:auto-rows-[minmax(13rem,auto)] lg:grid-flow-dense lg:grid-cols-4"
        >
          {site.services.items.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
