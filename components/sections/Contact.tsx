'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { AlertCircle, CheckCircle2, Clock, Loader2, Mail, MapPin, Navigation, Phone, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ENQUIRY_TYPES, enquirySchema, type EnquiryInput } from '@/lib/validation/checkout';
import { fullAddress, site, whatsappLink } from '@/data/site';
import { ENQUIRY_EVENT, type EnquiryKind } from '@/lib/events';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { WhatsAppIcon } from '@/components/ui/icons';
import { Kolam } from '@/components/ui/Kolam';
import { LogoMark } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

const inputCls =
  'w-full rounded-2xl border bg-surface px-4 text-[0.95rem] text-fg outline-none transition-[border-color,box-shadow] placeholder:text-muted/60 focus:border-forest focus:shadow-[0_0_0_4px_rgb(63_122_90/0.14)]';

export function Contact() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EnquiryInput>({
    resolver: zodResolver(enquirySchema),
    mode: 'onTouched',
    defaultValues: { name: '', phone: '', type: 'retail', message: '', website: '' },
  });

  // CTAs elsewhere (gift sets, checkout) can preselect the enquiry type
  useEffect(() => {
    const on = (e: Event) => setValue('type', (e as CustomEvent<EnquiryKind>).detail);
    window.addEventListener(ENQUIRY_EVENT, on);
    return () => window.removeEventListener(ENQUIRY_EVENT, on);
  }, [setValue]);

  const onSubmit = async (values: EnquiryInput) => {
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      if (!res.ok) throw new Error();
      setStatus('sent');
      reset();
    } catch {
      setStatus('error');
    }
  };

  const v = watch();
  const typeLabel = ENQUIRY_TYPES.find((t) => t.id === v.type)?.label ?? '';
  const whatsappEnquiry = whatsappLink(
    `Hello ${site.shortName}! ${typeLabel} enquiry.\nName: ${v.name || '-'}\nPhone: ${v.phone || '-'}\n${v.message || ''}`.trim(),
  );

  const err = (key: keyof EnquiryInput) =>
    errors[key] ? (
      <p id={`enq-${key}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[#dc2626] dark:text-[#fca5a5]">
        <AlertCircle size={13} aria-hidden="true" /> {errors[key]?.message}
      </p>
    ) : null;

  const cards = [
    { href: `tel:${site.contact.phoneHref}`, label: 'Call us', value: site.contact.phone, Icon: Phone, cls: 'bg-[linear-gradient(135deg,#6fa585,#2c5a42)] text-white' },
    {
      href: whatsappLink(`Hello ${site.shortName}! I'd like to know more about your wooden kitchenware.`),
      label: 'WhatsApp',
      value: 'Chat now',
      Icon: WhatsAppIcon,
      cls: 'bg-[#25d366] text-white',
      external: true,
    },
    { href: `mailto:${site.contact.email}`, label: 'Email', value: site.contact.email, Icon: Mail, cls: 'bg-[linear-gradient(135deg,#f6d9a6,#c68642)] text-[#3a1f0c]' },
  ];

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative scroll-mt-20 overflow-hidden py-24 sm:py-32">
      <Kolam className="absolute -left-48 top-20 h-[34rem] w-[34rem] text-forest/[0.06]" spin />
      <div className="container-page relative">
        <SectionHeading
          id="contact-title"
          eyebrow="Say namaste"
          title="Visit the workshop or"
          accent="drop us a line"
          subtitle="Questions about a piece, a bulk order for a wedding, or something custom-turned to your size: we reply within a working day."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col gap-5">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, ease: EASE }}
              className="rounded-[2rem] border border-line bg-card p-6 shadow-soft sm:p-8"
            >
              <div className="flex items-center gap-4">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[linear-gradient(135deg,#fff7e0,#f6d9a6)] shadow-sm ring-1 ring-honey/30">
                  <LogoMark className="h-11 w-11" />
                </span>
                <div>
                  <p className="font-display text-xl font-semibold text-fg">{site.contact.name}</p>
                  <p className="text-sm text-muted">{site.contact.role}</p>
                </div>
              </div>
              <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                {cards.map(({ href, label, value, Icon, cls, external }) => (
                  <li key={label}>
                    <motion.a
                      href={href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noopener noreferrer' : undefined}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex h-full flex-col gap-3 rounded-2xl border border-line bg-surface-2/60 p-4 transition-colors hover:border-honey"
                    >
                      <span className={cn('grid h-10 w-10 place-items-center rounded-xl', cls)}>
                        <Icon size={18} />
                      </span>
                      <span>
                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</span>
                        <span className="block break-all text-sm font-semibold text-fg">{value}</span>
                      </span>
                    </motion.a>
                  </li>
                ))}
              </ul>
              <div className="mt-6 grid gap-4 border-t border-line pt-6 text-sm sm:grid-cols-2">
                <div className="flex gap-3 text-muted">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  <address className="not-italic">{fullAddress}</address>
                </div>
                <div className="flex gap-3 text-muted">
                  <Clock size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  <ul>
                    {site.hours.map((h) => (
                      <li key={h.days}>
                        <span className="font-semibold text-fg">{h.days}</span>
                        <br />
                        {h.time}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
              className="relative overflow-hidden rounded-[2rem] border border-line shadow-soft"
            >
              <iframe
                title={`Map showing ${site.name}`}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(site.mapQuery)}&z=13&output=embed`}
                className="h-72 w-full grayscale-[35%] sepia-[20%] dark:invert-[0.9] dark:hue-rotate-180"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-surface/95 px-3.5 py-2 text-xs font-semibold text-fg shadow-lift backdrop-blur"
              >
                <Navigation size={13} aria-hidden="true" /> Get directions
              </a>
            </motion.div>
          </div>

          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
            className="relative flex flex-col gap-5 overflow-hidden rounded-[2rem] border border-line bg-card p-6 shadow-soft sm:p-8"
            aria-labelledby="enquiry-title"
          >
            <div className="wood-grain absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,#c68642,#a0522d)]" aria-hidden="true" />
            <div>
              <h3 id="enquiry-title" className="text-2xl font-semibold text-fg">
                Send an enquiry
              </h3>
              <p className="mt-1 text-sm text-muted">Retail, bulk, wholesale or a custom piece: tell us what you need.</p>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-fg">Enquiry type</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ENQUIRY_TYPES.map((t) => (
                  <label
                    key={t.id}
                    className={cn(
                      'relative flex h-11 cursor-pointer items-center justify-center rounded-2xl border px-2 text-center text-[0.8rem] font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-forest',
                      v.type === t.id ? 'border-transparent text-[#3a1f0c]' : 'border-line-strong text-muted hover:border-honey hover:text-fg',
                    )}
                  >
                    {v.type === t.id && (
                      <motion.span
                        layoutId="enquiry-type"
                        className="absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,#f6d9a6,#e2a867)]"
                        transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                      />
                    )}
                    <input type="radio" value={t.id} {...register('type')} className="sr-only" />
                    <span className="relative">{t.label}</span>
                  </label>
                ))}
              </div>
              {err('type')}
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="enq-name" className="mb-1.5 block text-sm font-medium text-fg">
                  Your name
                </label>
                <input
                  id="enq-name"
                  {...register('name')}
                  autoComplete="name"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'enq-name-error' : undefined}
                  className={cn(inputCls, 'h-12', errors.name ? 'border-[#dc2626]' : 'border-line-strong')}
                  placeholder="Anita Rao"
                />
                {err('name')}
              </div>
              <div>
                <label htmlFor="enq-phone" className="mb-1.5 block text-sm font-medium text-fg">
                  Mobile number
                </label>
                <input
                  id="enq-phone"
                  {...register('phone')}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'enq-phone-error' : undefined}
                  className={cn(inputCls, 'h-12', errors.phone ? 'border-[#dc2626]' : 'border-line-strong')}
                  placeholder="98765 43210"
                />
                {err('phone')}
              </div>
            </div>
            <div>
              <label htmlFor="enq-message" className="mb-1.5 block text-sm font-medium text-fg">
                Message
              </label>
              <textarea
                id="enq-message"
                {...register('message')}
                rows={4}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? 'enq-message-error' : undefined}
                className={cn(inputCls, 'py-3', errors.message ? 'border-[#dc2626]' : 'border-line-strong')}
                placeholder="e.g. 150 spoon & spatula sets as wedding return gifts, delivered to Chennai by 20 December."
              />
              {err('message')}
            </div>
            {/* honeypot for bots: hidden from people and screen readers */}
            <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden="true" />

            <AnimatePresence mode="wait">
              {status === 'sent' && (
                <motion.p
                  key="sent"
                  role="status"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 rounded-2xl border border-leaf/30 bg-leaf/10 p-3 text-sm font-medium text-leaf"
                >
                  <CheckCircle2 size={17} aria-hidden="true" /> Thank you! We’ll get back to you within a working day.
                </motion.p>
              )}
              {status === 'error' && (
                <motion.p
                  key="error"
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 rounded-2xl border border-[#fca5a5] bg-[#fef2f2] p-3 text-sm text-[#991b1b] dark:border-[#7f1d1d] dark:bg-[#450a0a] dark:text-[#fecaca]"
                >
                  <AlertCircle size={17} aria-hidden="true" /> That didn’t send. Please try again, or message us on WhatsApp.
                </motion.p>
              )}
            </AnimatePresence>

            <div className="mt-auto flex flex-col gap-3 sm:flex-row">
              <Button type="submit" size="lg" className="flex-1" disabled={status === 'sending'}>
                {status === 'sending' ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Send size={17} aria-hidden="true" />}
                Send enquiry
              </Button>
              <a
                href={whatsappEnquiry}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-full border border-[#25d366]/50 bg-[#25d366]/10 px-6 font-semibold text-[#128c4a] transition-colors hover:bg-[#25d366]/20 dark:text-[#4ade80]"
              >
                <WhatsAppIcon size={18} /> Send on WhatsApp
              </a>
            </div>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
