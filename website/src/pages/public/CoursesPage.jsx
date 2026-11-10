import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Check, Clock, Workflow } from 'lucide-react';
import { MarketingCta, IconWell, MktCard } from '../../components/marketing/MarketingCta';
import { PageHero, Reveal, SectionHeading, CtaBand } from '../../components/marketing/MktKit';
import { cn } from '../../lib/utils';
import { COURSES, COURSE_STEPS as steps } from '../../constants/courses';
import api from '../../lib/api';
import { BUSINESSES } from '../../constants/site';
import { PhotoFrame, SiteImage, useSiteImage } from '../../components/marketing/SiteImage';

const heroSlides = [
  { slot: 'courses-hero', caption: 'Our students' },
  { slot: 'course-basic-computer', caption: 'Basic Computer' },
  { slot: 'course-ms-office', caption: 'MS Office' },
  { slot: 'course-tally', caption: 'Tally Prime with GST' },
  { slot: 'course-web-development', caption: 'Web Development' },
  { slot: 'course-python', caption: 'Python Programming' },
  { slot: 'course-graphic-design', caption: 'Graphic Design' },
  { slot: 'home-gallery-certificate', caption: 'Certificate on completion' },
];

export default function CoursesPage() {
  const [images, setImages] = useState({});
  const heroPhoto = useSiteImage('courses-hero');

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

  return (
    <div>
      <PageHero
        brand="institute"
        eyebrow={`${BUSINESSES.institute.name} · Courses`}
        icon={BookOpen}
        title="Practical courses,"
        highlight="real skills."
        text={`Short-term and diploma courses at ${BUSINESSES.institute.name}, taught in a hands-on lab. Admission, fee receipts and certificates are all issued by ${BUSINESSES.institute.name}.`}
        aside={heroPhoto ? <PhotoFrame slides={heroSlides} badge={`${COURSES.length} certified courses`} badgeIcon={BookOpen} /> : undefined}
      >
        <MarketingCta to="/admission" className="px-7 py-3.5">
          Apply online
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </MarketingCta>
        <MarketingCta to="/contact?type=course" variant="glass" className="px-7 py-3.5">
          Ask a question
        </MarketingCta>
      </PageHero>

      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="All courses" title="Choose your" highlight="course" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COURSES.map((course, index) => (
              <Reveal key={course.slug} delay={(index % 3) * 80}>
                <MktCard accent={course.accent} icon={course.icon} className="flex flex-col hover:border-blue-200">
                  <SiteImage
                    slot={`course-${course.slug}`}
                    override={images[course.slug]}
                    className="mb-4 aspect-[16/9] rounded-2xl ring-1 ring-slate-200/70"
                    imgClassName="transition duration-700 ease-premium group-hover:scale-105"
                    fallback={<IconWell icon={course.icon} tone={course.tone} />}
                  />
                  <h3 className="text-lg font-bold text-slate-900">{course.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                      <Clock className="h-3 w-3" />
                      {course.duration}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{course.level}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{course.text}</p>
                  <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {course.topics.map((topic) => (
                      <li key={topic} className="flex items-center gap-1.5 text-[13px] text-slate-700">
                        <Check className="h-3.5 w-3.5 shrink-0 text-blue-600" strokeWidth={3} />
                        {topic}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                    <MarketingCta to={`/admission?course=${course.slug}`} className="w-full">
                      Apply
                    </MarketingCta>
                    <MarketingCta to={`/contact?course=${course.slug}`} variant="outline" className="w-full">
                      Enquire
                    </MarketingCta>
                  </div>
                </MktCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-slate-50 py-12 sm:py-14">
        <div className="mkt-section-dots absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            brand="institute"
            eyebrow="Admission process"
            icon={Workflow}
            title={`Join ${BUSINESSES.institute.short} in`}
            highlight="five easy steps"
            text="From your first call to your certificate, we guide you at every step."
          />
          <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, index) => (
              <Reveal as="li" key={step.label} delay={index * 90} className="relative">
                <div className="group h-full rounded-3xl border border-slate-200/70 bg-white p-5 text-center shadow-[0_14px_34px_-20px_rgba(15,23,42,0.25)] transition duration-300 ease-premium hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-[0_28px_50px_-24px_rgba(11,31,75,0.35)]">
                  <span className={cn('relative mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ring-4 ring-white transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110', step.tone)}>
                    <step.icon className="h-6 w-6" />
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white ring-2 ring-white">
                      {index + 1}
                    </span>
                  </span>
                  <p className="text-sm font-bold text-slate-900">{step.label}</p>
                  <p className="mt-1 text-[12px] leading-5 text-slate-500">{step.hint}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <CtaBand brand="institute" eyebrow="Not sure?" title="Get free career counselling." text="Tell us your goal and we will suggest the right course and batch timing.">
        <MarketingCta to="/contact" className="px-7 py-3.5">Book counselling</MarketingCta>
      </CtaBand>
    </div>
  );
}
