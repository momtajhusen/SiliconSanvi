import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CheckCircle2, ClipboardList, FileCheck2, GraduationCap, PhoneCall, Send, UserCheck } from 'lucide-react';
import { PageHero, Reveal } from '../../components/marketing/MktKit';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import api, { apiError } from '../../lib/api';
import { COURSES } from '../../constants/courses';
import { BUSINESSES } from '../../constants/site';
import { PhotoFrame, useSiteImage } from '../../components/marketing/SiteImage';

const FIELD = 'mkt-field h-12 rounded-xl bg-slate-50';
const PHONE = /^[0-9+\s-]{10,15}$/;

const heroSlides = [
  { slot: 'admission-hero', caption: 'Learn in class' },
  { slot: 'home-gallery-lab', caption: 'Modern computer lab' },
  { slot: 'course-dca-adca', caption: 'Diploma courses' },
  { slot: 'home-gallery-certificate', caption: 'Certificate on completion' },
];

const STEPS = [
  { icon: ClipboardList, title: 'Fill the form', text: 'Takes about 2 minutes. No payment needed online.' },
  { icon: PhoneCall, title: 'We call you', text: 'Our counsellor confirms the course, batch timing and fee.' },
  { icon: FileCheck2, title: 'Visit with documents', text: 'Aadhaar, 2 photos and last marksheet. Pay the admission fee.' },
  { icon: UserCheck, title: 'Start classes', text: 'Get your student ID and join your batch.' },
];

function Field({ label, required, error, children, className }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}

function emptyForm(course = '') {
  return {
    name: '', phone: '', gender: '', dob: '', email: '', fatherName: '', qualification: '', address: '',
    course, preferredBatch: 'Morning', message: '',
  };
}

export default function AdmissionPage() {
  const [params] = useSearchParams();
  const [courses, setCourses] = useState(() => COURSES.map((c) => ({ slug: c.slug, courseName: c.title })));
  const [form, setForm] = useState(() => emptyForm(params.get('course') || ''));
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);
  const heroPhoto = useSiteImage('admission-hero');
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  useEffect(() => {
    api
      .get('/public/courses')
      .then(({ data }) => {
        const list = data.items.filter((c) => c.slug);
        if (list.length) setCourses(list);
      })
      .catch(() => {});
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Please enter your name';
    if (!PHONE.test(form.phone.trim())) next.phone = 'Enter a valid 10-digit mobile number';
    if (!form.gender) next.gender = 'Please select';
    if (!form.course) next.course = 'Please choose a course';
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error('Please fill the highlighted fields');
      return;
    }
    setSending(true);
    try {
      const { data } = await api.post('/public/admissions', { ...form, dob: form.dob || undefined });
      const course = courses.find((c) => c.slug === form.course);
      setDone({ number: data.inquiryNumber, name: form.name, course: course?.courseName });
      setForm(emptyForm());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toast.error(apiError(error, 'Could not submit. Please call us instead.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHero
        compact
        brand="institute"
        eyebrow={`${BUSINESSES.institute.name} · Admissions open`}
        icon={GraduationCap}
        title="Apply online —"
        highlight="start learning this month."
        text={`Fill the ${BUSINESSES.institute.name} admission form and our counsellor will call you to confirm your course, batch and fee.`}
        aside={heroPhoto ? <PhotoFrame slides={heroSlides} badge="Takes about 2 minutes" badgeIcon={ClipboardList} /> : undefined}
      />

      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">How admission works</h2>
            {STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 80}>
                <div className="flex items-start gap-4 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-100">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 text-white shadow-md">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-blue-700">Step {index + 1}</span>
                    <span className="block font-semibold text-slate-900">{step.title}</span>
                    <span className="block text-sm text-slate-500">{step.text}</span>
                  </span>
                </div>
              </Reveal>
            ))}
            <p className="text-sm text-slate-500">
              Questions? Call <a href={BUSINESSES.institute.phoneHref} className="font-semibold text-blue-700">{BUSINESSES.institute.phone}</a> or{' '}
              <Link to="/courses" className="font-semibold text-blue-700">see all courses</Link>.
            </p>
          </div>

          <Reveal>
            {done ? (
              <div className="rounded-3xl border border-slate-200/70 bg-white p-8 text-center shadow-[0_28px_70px_-40px_rgba(11,31,75,0.45)]">
                <CheckCircle2 className="mx-auto h-14 w-14 text-blue-600" />
                <h2 className="mt-4 text-2xl font-extrabold text-slate-900">Application received!</h2>
                <p className="mt-2 text-slate-600">
                  Thank you, {done.name}. Your application{done.course ? ` for ${done.course}` : ''} has been submitted.
                </p>
                <p className="mt-4 inline-block rounded-xl bg-blue-50 px-4 py-2 text-sm text-blue-900">
                  Application no. <b>{done.number}</b>
                </p>
                <p className="mt-4 text-sm text-slate-500">Our counsellor will call you within one working day. Keep this number for reference.</p>
                <Button variant="outline" className="mt-6 rounded-full" onClick={() => setDone(null)}>Submit another application</Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_28px_70px_-40px_rgba(11,31,75,0.45)] sm:p-8">
                <h2 className="text-lg font-bold text-slate-900">Online admission form</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" required error={errors.name}>
                    <Input value={form.name} onChange={update('name')} placeholder="As on Aadhaar" className={FIELD} />
                  </Field>
                  <Field label="Mobile / WhatsApp" required error={errors.phone}>
                    <Input type="tel" value={form.phone} onChange={update('phone')} placeholder="98765 43210" className={FIELD} />
                  </Field>
                  <Field label="Gender" required error={errors.gender}>
                    <Select value={form.gender} onChange={update('gender')} className={FIELD}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </Select>
                  </Field>
                  <Field label="Date of birth">
                    <Input type="date" value={form.dob} onChange={update('dob')} className={FIELD} />
                  </Field>
                  <Field label="Father's name">
                    <Input value={form.fatherName} onChange={update('fatherName')} className={FIELD} />
                  </Field>
                  <Field label="Qualification">
                    <Input value={form.qualification} onChange={update('qualification')} placeholder="e.g. 10th, 12th, B.A." className={FIELD} />
                  </Field>
                  <Field label="Course" required error={errors.course}>
                    <Select value={form.course} onChange={update('course')} className={FIELD}>
                      <option value="">Select a course</option>
                      {courses.map((c) => (
                        <option key={c.slug} value={c.slug}>{c.courseName}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Preferred batch">
                    <Select value={form.preferredBatch} onChange={update('preferredBatch')} className={FIELD}>
                      <option>Morning</option>
                      <option>Afternoon</option>
                      <option>Evening</option>
                    </Select>
                  </Field>
                  <Field label="Email">
                    <Input type="email" value={form.email} onChange={update('email')} className={FIELD} />
                  </Field>
                  <Field label="Address">
                    <Input value={form.address} onChange={update('address')} placeholder="Village / town" className={FIELD} />
                  </Field>
                </div>
                <Field label="Anything you want to ask? (optional)">
                  <Textarea rows={3} value={form.message} onChange={update('message')} className="mkt-field rounded-xl bg-slate-50" />
                </Field>
                <Button type="submit" loading={sending} className="mkt-cta-solid group h-12 w-full gap-2 rounded-full bg-gradient-to-r from-blue-900 to-blue-700 text-sm font-semibold shadow-lg shadow-blue-700/25 hover:from-blue-950 hover:to-blue-800">
                  {sending ? 'Submitting…' : 'Submit application'}
                  <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
                <p className="text-center text-xs text-slate-400">No payment is taken online. Fee is paid at the institute after confirmation.</p>
              </form>
            )}
          </Reveal>
        </div>
      </section>
    </div>
  );
}
