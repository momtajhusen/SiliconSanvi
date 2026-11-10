import { Outlet, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Users, IndianRupee, GraduationCap, Check, ArrowLeft } from 'lucide-react';
import BrandMark from '../marketing/BrandMark';
import PageFade from '../motion/PageFade';
import { HeroBackdrop, Eyebrow, ChannelMarquee, CHANNEL_DOTS } from '../marketing/MktKit';
import { cn } from '../../lib/utils';

const panelPoints = ['Student admissions', 'Fee records', 'Batches & courses', 'Certificates'];

const panelCards = [
  { icon: GraduationCap, hint: 'New admission', title: 'Web Development', pos: '-left-4 top-6', well: 'from-blue-400 to-blue-600' },
  { icon: IndianRupee, hint: 'Fee received', title: '₹4,500 · Tally', pos: '-right-4 bottom-10 mkt-float-delay', well: 'from-amber-400 to-orange-500' },
  { icon: Users, hint: 'Today', title: '128 students present', pos: '-top-4 right-10', well: 'from-blue-600 to-blue-800' },
];

const bars = [42, 70, 55, 92, 64, 80, 48, 76, 60, 88];

function PanelPreview() {
  return (
    <div className="flex h-full flex-col rounded-[1.4rem] bg-white/95 p-5 text-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
          </span>
          <p className="ml-2 text-sm font-bold">Institute desk</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse-soft" />
          Live
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Students', value: '486', tone: 'bg-blue-50 text-blue-700' },
          { label: 'Batches', value: '18', tone: 'bg-blue-50 text-blue-800' },
          { label: 'Fees', value: '₹3.6L', tone: 'bg-violet-50 text-violet-700' },
        ].map((kpi) => (
          <div key={kpi.label} className={cn('rounded-xl px-2.5 py-3', kpi.tone)}>
            <p className="text-[11px] font-medium opacity-80">{kpi.label}</p>
            <p className="text-xl font-bold leading-none">{kpi.value}</p>
          </div>
        ))}
      </div>
      <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Admissions · 10 days</p>
      <div className="flex min-h-[5rem] flex-1 items-end gap-1.5">
        {bars.map((height, index) => (
          <div
            key={index}
            className="origin-bottom flex-1 rounded-t-md bg-gradient-to-t from-blue-900 to-blue-500 animate-bar-rise"
            style={{ height: `${height}%`, animationDelay: `${300 + index * 70}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function AuthLayout() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('force-light');
    return () => {
      root.classList.remove('force-light');
      const stored = localStorage.getItem('silicon-theme');
      if (stored === 'dark') root.classList.add('dark');
    };
  }, []);

  return (
    <div className="auth-split relative grid min-h-dvh bg-[#f3f6fb] lg:grid-cols-[1.05fr_1fr]">
      <aside className="mkt-hero relative isolate hidden overflow-hidden px-10 py-9 text-white lg:sticky lg:top-0 lg:h-dvh lg:self-start lg:flex lg:flex-col xl:px-14">
        <HeroBackdrop />
        <div className="mkt-rise">
          <BrandMark dark tagline />
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col py-6 [@media(max-height:760px)]:py-4">
          <div className="relative max-w-lg shrink-0">
            <div className="mkt-rise" style={{ '--rise-delay': '80ms' }}>
              <Eyebrow dark>Silicon &amp; Sanvi · Staff portal</Eyebrow>
            </div>
            <h2 className="mkt-rise mt-5 text-4xl font-extrabold leading-[1.05] xl:text-5xl [@media(max-height:800px)]:mt-4 [@media(max-height:800px)]:text-4xl" style={{ '--rise-delay': '140ms' }}>
              Your institute,
              <br />
              <span className="mkt-gradient-text-light">one desk.</span>
            </h2>
            <p className="mkt-rise mt-4 text-base leading-7 text-blue-50/80" style={{ '--rise-delay': '200ms' }}>
              Sign in to manage students, admissions, fees and batches from one place.
            </p>
            <ul className="mkt-rise mt-6 grid grid-cols-2 gap-x-4 gap-y-2.5 [@media(max-height:800px)]:hidden" style={{ '--rise-delay': '260ms' }}>
              {panelPoints.map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm font-medium text-blue-50">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-300/20 text-blue-200">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mt-7 min-h-0 flex-1 [@media(max-height:760px)]:mt-5 [@media(max-height:620px)]:hidden">
            <div className="mkt-rise absolute inset-0 rounded-[1.75rem] bg-white/10 p-1.5 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.6)] ring-1 ring-white/20 backdrop-blur" style={{ '--rise-delay': '320ms' }}>
              <PanelPreview />
            </div>
            {panelCards.map((card) => (
              <div
                key={card.title}
                className={cn('mkt-float absolute z-10 flex items-center gap-3 rounded-2xl [@media(max-height:780px)]:hidden border border-white/20 bg-blue-950/55 px-3.5 py-2.5 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)] backdrop-blur-md', card.pos)}
              >
                <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', card.well)}>
                  <card.icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-[11px] text-blue-100/75">{card.hint}</span>
                  <span className="block text-sm font-semibold text-white">{card.title}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative -mx-10 xl:-mx-14">
          <p className="mb-3 px-10 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100/60 xl:px-14">Courses we teach</p>
          <ChannelMarquee items={CHANNEL_DOTS} dark />
        </div>
      </aside>

      <main className="relative flex min-h-dvh flex-col overflow-x-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="mkt-grid-bg-light" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-[22rem] w-[22rem] rounded-full bg-blue-300/25 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-[20rem] w-[20rem] rounded-full bg-blue-300/20 blur-3xl animate-float-slow" />

        <header className="relative z-20 flex items-center justify-between px-5 py-4 sm:px-8">
          <span className="lg:invisible">
            <BrandMark tagline />
          </span>
          <Link
            to="/"
            className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:text-blue-700"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
            Back to home
          </Link>
        </header>

        <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-6">
          <div className="w-full max-w-[440px]">
            <PageFade>
              <Outlet />
            </PageFade>
          </div>
        </div>
      </main>
    </div>
  );
}
