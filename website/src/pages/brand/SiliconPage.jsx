import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Award, BookOpen, Check, ChevronLeft, ChevronRight, Clock, Laptop, Briefcase, Star, Users, Workflow,
} from 'lucide-react';
import { MarketingCta } from '../../components/marketing/MarketingCta';
import { Reveal, SectionHeading, CountUp, CtaBand } from '../../components/marketing/MktKit';
import { BrandTile } from '../../components/marketing/BrandWordmark';
import { useSlideshow } from '../../components/brandsite/hooks';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import { SiteImage } from '../../components/marketing/SiteImage';
import { BUSINESSES, DIVISIONS, brandRest } from '../../constants/site';
import { COURSES, COURSE_STEPS } from '../../constants/courses';

const info = BUSINESSES.institute;
const division = DIVISIONS.find((item) => item.key === 'institute');
const FEATURED = COURSES.slice(0, 5);
const SLIDE_MS = 6500;

const pointIcons = [Award, Laptop, Briefcase];

const stats = [
  { icon: Users, value: 5000, suffix: '+', label: 'Students trained', hint: 'Since we opened' },
  { icon: Star, value: 10, suffix: '+', label: 'Years of trust', hint: 'Serving our town' },
];

function useCourseImages() {
  const [images, setImages] = useState({});
  useEffect(() => {
    let alive = true;
    api
      .get('/public/courses')
      .then(({ data }) => {
        if (!alive) return;
        setImages(Object.fromEntries((data.items || []).filter((c) => c.slug && c.image).map((c) => [c.slug, c.image])));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return images;
}

function BrandVisual() {
  return (
    <div className="relative">
      <div className="silicon-visual relative isolate overflow-hidden rounded-[2rem] p-7 text-white shadow-[0_50px_100px_-45px_rgba(245,158,11,0.7)] ring-1 ring-white/10 sm:p-9 sm:pb-12">
        <info.icon className="absolute -bottom-8 -right-6 h-48 w-48 text-white/10" strokeWidth={1} aria-hidden="true" />
        <BrandTile business="institute" size="lg" />
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-100">{info.kind}</p>
        <ul className="mt-4 space-y-2.5">
          {info.services.map((service, index) => (
            <li key={service} className="brand-slide-in flex items-center gap-3 text-sm font-semibold sm:text-[15px]" style={{ animationDelay: `${120 + index * 80}ms` }}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
                <Check className="h-4 w-4 text-amber-100" strokeWidth={3} />
              </span>
              {service}
            </li>
          ))}
        </ul>
      </div>
      {division.points.map((point, index) => {
        const Icon = pointIcons[index];
        return (
          <div
            key={point}
            className={cn(
              'mkt-float absolute hidden items-center gap-2.5 rounded-2xl border border-amber-100 bg-white px-3.5 py-2.5 shadow-xl sm:flex',
              index === 0 && '-right-5 -top-5',
              index === 1 && '-right-8 top-[46%] mkt-float-delay',
              index === 2 && '-bottom-6 right-14'
            )}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-orange-700"><Icon className="h-4 w-4" /></span>
            <span className="text-[13px] font-bold text-slate-800">{point}</span>
          </div>
        );
      })}
    </div>
  );
}

function CourseVisual({ course, image }) {
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-[2rem] bg-white p-3 shadow-[0_50px_100px_-45px_rgba(245,158,11,0.6)] ring-1 ring-amber-200/40">
        <SiteImage
          slot={`course-${course.slug}`}
          override={image}
          eager
          className="aspect-[4/3] rounded-[1.5rem]"
          imgClassName="mkt-kenburns"
          fallback={(
            <div className="silicon-visual relative isolate flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[1.5rem]">
              <span className="absolute h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
              <span className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] bg-white/15 text-white ring-1 ring-white/30 backdrop-blur">
                <course.icon className="h-14 w-14" strokeWidth={1.6} />
              </span>
            </div>
          )}
        />
        <div className="grid grid-cols-2 gap-2 p-3 pt-4">
          {course.topics.map((topic, index) => (
            <span key={topic} className="brand-slide-in flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[13px] font-semibold text-stone-700" style={{ animationDelay: `${150 + index * 70}ms` }}>
              <Check className="h-3.5 w-3.5 shrink-0 text-orange-600" strokeWidth={3} />
              {topic}
            </span>
          ))}
        </div>
      </div>
      <div className="mkt-float absolute -right-4 -top-5 hidden items-center gap-2 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 px-4 py-2.5 text-stone-950 shadow-xl sm:flex">
        <Clock className="h-4 w-4 text-stone-900" />
        <span className="text-sm font-bold">{course.duration}</span>
      </div>
    </div>
  );
}

function SiliconSlideshow({ images }) {
  const slides = useMemo(() => [{ key: 'brand' }, ...FEATURED.map((course) => ({ key: course.slug, course }))], []);
  const show = useSlideshow(slides.length, SLIDE_MS);
  const slide = slides[show.index];
  const course = slide.course;

  return (
    <section className="silicon-hero relative isolate overflow-hidden lg:flex lg:min-h-[calc(100dvh-119px)] lg:flex-col" aria-roledescription="carousel" {...show.regionProps}>
      <div className="silicon-notebook" aria-hidden="true" />
      <div className="mx-auto grid min-h-[560px] w-full max-w-6xl items-center lg:flex-1 gap-12 px-4 pb-10 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16">
        <div key={slide.key} className="min-w-0 animate-fade-up">
          {course ? (
            <>
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-stone-950">
                <course.icon className="h-4 w-4" />
                {course.duration} · {course.level}
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
                <span className="brand-text-sanvi-light">{course.title}</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-stone-300 sm:text-lg">{course.text}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <MarketingCta to={`/admission?course=${course.slug}`} variant="amber" className="px-8 py-3.5">
                  Apply
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </MarketingCta>
                <MarketingCta to={`/contact?course=${course.slug}`} variant="glass" className="px-8 py-3.5">Enquire</MarketingCta>
              </div>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-stone-950">
                <info.icon className="h-4 w-4" />
                {info.kind}
              </span>
              <h1 className="mt-5 leading-[0.95] tracking-tight">
                <span className="brand-word brand-text-sanvi-light block text-6xl sm:text-7xl lg:text-[5.4rem]">{info.short}</span>
                <span className="mt-2 block text-2xl font-bold text-white sm:text-3xl">{brandRest(info)}</span>
              </h1>
              <p className="mt-5 text-xl font-semibold text-amber-300">{info.tagline}</p>
              <p className="mt-3 max-w-xl text-base leading-7 text-stone-300">{info.text}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <MarketingCta to="/admission" variant="amber" className="px-8 py-3.5">
                  Apply online
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </MarketingCta>
                <MarketingCta to="/silicon#courses" variant="glass" className="px-8 py-3.5">
                  <BookOpen className="h-4 w-4" />
                  {info.cta}
                </MarketingCta>
              </div>
            </>
          )}
        </div>
        <div key={`visual-${slide.key}`} className="brand-slide-in min-w-0 px-4 sm:px-8 lg:px-4">
          {course ? <CourseVisual course={course} image={images[course.slug]} /> : <BrandVisual />}
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <button type="button" onClick={show.prev} aria-label="Previous" className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-amber-300 ring-1 ring-white/10 transition hover:bg-amber-400 hover:text-stone-950 sm:flex">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none]" role="tablist">
            {slides.map((item, index) => {
              const selected = index === show.index;
              const Icon = item.course ? item.course.icon : info.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => show.go(index)}
                  className={cn(
                    'relative flex min-w-[9.5rem] flex-1 items-center gap-2.5 overflow-hidden rounded-xl px-3 py-2.5 text-left transition duration-300',
                    selected ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 shadow-lg shadow-orange-500/25' : 'bg-white/5 text-stone-300 ring-1 ring-white/10 hover:bg-white/10'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', selected ? 'text-stone-950' : 'text-amber-400')} />
                  <span className="truncate text-[12.5px] font-semibold">{item.course ? item.course.title : info.short}</span>
                  {selected && (
                    <span className="absolute inset-x-0 bottom-0 h-[3px] bg-black/15">
                      <span key={show.index} {...show.progressProps()} className="mkt-slide-progress block h-full bg-stone-950/70" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={show.next} aria-label="Next" className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-amber-300 ring-1 ring-white/10 transition hover:bg-amber-400 hover:text-stone-950 sm:flex">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function StatsRibbon() {
  return (
    <section className="relative z-10 px-4 pt-12 sm:px-6">
      <Reveal className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-3xl bg-amber-100 shadow-[0_30px_70px_-45px_rgba(194,65,12,0.5)] ring-1 ring-amber-100 lg:grid-cols-5">
        {stats.map((item) => (
          <div key={item.label} className="flex flex-col items-center bg-white px-4 py-6 text-center">
            <item.icon className="mb-2 h-5 w-5 text-orange-600" />
            <CountUp value={item.value} suffix={item.suffix} className="brand-text-sanvi text-3xl font-extrabold" />
            <p className="mt-1 text-sm font-semibold text-slate-800">{item.label}</p>
            <p className="text-[11px] text-slate-500">{item.hint}</p>
          </div>
        ))}
        {division.points.map((point, index) => {
          const Icon = pointIcons[index];
          return (
            <div key={point} className={cn('flex flex-col items-center justify-center bg-white px-4 py-6 text-center', index === 2 && 'col-span-2 lg:col-span-1')}>
              <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/25">
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-sm font-bold text-slate-800">{point}</p>
            </div>
          );
        })}
      </Reveal>
    </section>
  );
}

function CourseCatalog({ images }) {
  const levels = useMemo(() => [...new Set(COURSES.map((course) => course.level))], []);
  const [level, setLevel] = useState(null);
  const visible = level ? COURSES.filter((course) => course.level === level) : COURSES;

  return (
    <section id="courses" className="scroll-mt-28 bg-white py-12 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading brand="institute" eyebrow="All courses" icon={BookOpen} title="Choose your" highlight="course" />
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {[null, ...levels].map((item) => (
            <button
              key={item || 'all'}
              type="button"
              onClick={() => setLevel(item)}
              className={cn(
                'rounded-full px-4 py-2 text-[13px] font-semibold transition duration-300',
                level === item ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 shadow-md shadow-orange-500/25' : 'bg-amber-50 text-orange-800 hover:bg-amber-100'
              )}
            >
              {item || 'All courses'}
            </button>
          ))}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((course, index) => (
            <Reveal key={course.slug} delay={(index % 3) * 80}>
              <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/80 transition duration-300 ease-premium hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-30px_rgba(194,65,12,0.45)] hover:ring-amber-300">
                <div className="silicon-visual relative isolate flex h-36 items-end justify-between overflow-hidden p-5">
                  <SiteImage
                    slot={`course-${course.slug}`}
                    override={images[course.slug]}
                    className="absolute inset-0 -z-10"
                    imgClassName="opacity-90 transition duration-700 group-hover:scale-105"
                    fallback={<course.icon className="absolute -right-5 -top-5 -z-10 h-32 w-32 rotate-12 text-white/10 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110" strokeWidth={1.2} aria-hidden="true" />}
                  >
                    <span className="absolute inset-0 bg-gradient-to-t from-stone-950/80 to-transparent" aria-hidden="true" />
                  </SiteImage>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/30 backdrop-blur transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                    <course.icon className="h-6 w-6" />
                  </span>
                  <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-950">{course.level}</span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-bold text-slate-900">{course.title}</h3>
                  <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                    <Clock className="h-3 w-3" />
                    {course.duration}
                  </span>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{course.text}</p>
                  <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {course.topics.map((topic) => (
                      <li key={topic} className="flex items-center gap-1.5 text-[13px] text-slate-700">
                        <Check className="h-3.5 w-3.5 shrink-0 text-orange-600" strokeWidth={3} />
                        {topic}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                    <MarketingCta to={`/admission?course=${course.slug}`} variant="amber" className="w-full">Apply</MarketingCta>
                    <MarketingCta to={`/contact?course=${course.slug}`} variant="outline-amber" className="w-full">Enquire</MarketingCta>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function InstituteDetails() {
  return (
    <section className="relative bg-stone-50 py-12 sm:py-14">
      <div className="mkt-section-dots absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-800">
            <division.icon className="h-4 w-4" />
            {division.tagline}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            <span className="brand-text-sanvi">{division.title}</span>
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">{division.text}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {info.services.map((service) => (
              <li key={service} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200/70">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-950 text-amber-400"><Check className="h-4 w-4" strokeWidth={3} /></span>
                {service}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={120}>
          <div className="silicon-certificate relative rounded-[1.75rem] px-8 py-12 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-lg ring-4 ring-amber-100">
              <Award className="h-8 w-8" />
            </span>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.25em] text-orange-700/70">Issued in this name</p>
            <p className="mt-3 font-serif text-3xl font-bold text-stone-900 sm:text-[2.1rem]">{info.name}</p>
            <span className="mx-auto mt-4 block h-px w-40 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-slate-600">
              <info.billingIcon className="h-4 w-4 text-orange-600" />
              {info.billing}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StepsTimeline() {
  return (
    <section className="bg-white py-12 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Admission process"
          icon={Workflow}
          title={`Join ${info.short} in`}
          highlight="five easy steps"
          text="From your first call to your certificate, we guide you at every step."
        />
        <ol className="relative grid gap-8 lg:grid-cols-5 lg:gap-4">
          <span className="silicon-timeline-line absolute left-[10%] right-[10%] top-8 hidden h-1 rounded-full lg:block" aria-hidden="true" />
          {COURSE_STEPS.map((step, index) => (
            <Reveal as="li" key={step.label} delay={index * 100} className="group relative flex items-center gap-4 lg:flex-col lg:text-center">
              <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-orange-700 shadow-lg ring-4 ring-amber-100 transition duration-300 group-hover:scale-110 group-hover:bg-amber-400 group-hover:text-stone-950">
                <step.icon className="h-7 w-7" />
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-[11px] font-bold text-white ring-2 ring-white">{index + 1}</span>
              </span>
              <span>
                <span className="block text-base font-bold text-slate-900">{step.label}</span>
                <span className="mt-0.5 block text-[13px] text-slate-500">{step.hint}</span>
              </span>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default function SiliconPage() {
  const images = useCourseImages();
  return (
    <div>
      <SiliconSlideshow images={images} />
      <StatsRibbon />
      <CourseCatalog images={images} />
      <InstituteDetails />
      <StepsTimeline />
      <CtaBand brand="institute" eyebrow="Not sure?" title="Get free career counselling." text="Tell us your goal and we will suggest the right course and batch timing.">
        <MarketingCta to="/contact?type=course" variant="amber" className="px-7 py-3.5">Book counselling</MarketingCta>
        <Link to="/admission" className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/20">
          Apply online
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </CtaBand>
    </div>
  );
}
