import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Modal from '../ui/Modal';
import { FormBanner } from '../ui/FormBanner';
import Field from './Field';
import ImageUpload from './ImageUpload';
import { COURSE_LEVELS, COURSE_TYPES, ENTITY_STATUSES } from '../../constants/institute';
import { labelize } from '../../lib/format';
import api, { apiError } from '../../lib/api';

const EMPTY = {
  image: '', courseCode: '', courseName: '', slug: '', shortDescription: '', description: '',
  durationMonths: 3, baseFee: '', admissionFee: 500, examFee: 300,
  courseType: 'certificate', level: 'beginner', status: 'active', sortOrder: 0,
  syllabus: '', prerequisites: '', learningOutcomes: '',
};

function CourseForm({ course, onClose, onSaved }) {
  const [form, setForm] = useState(() => (course ? { ...EMPTY, ...course } : EMPTY));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.courseCode.trim() || !form.courseName.trim()) return setError('Course code and name are required');
    if (!(Number(form.durationMonths) > 0)) return setError('Duration must be at least 1 month');
    if (form.baseFee === '' || Number(form.baseFee) < 0) return setError('Enter the course fee');
    setError('');
    setSaving(true);
    const body = {
      image: form.image || '', courseCode: form.courseCode, courseName: form.courseName, slug: form.slug,
      shortDescription: form.shortDescription, description: form.description,
      durationMonths: Number(form.durationMonths), baseFee: Number(form.baseFee),
      admissionFee: Number(form.admissionFee) || 0, examFee: Number(form.examFee) || 0,
      courseType: form.courseType, level: form.level, status: form.status, sortOrder: Number(form.sortOrder) || 0,
      syllabus: form.syllabus || '', prerequisites: form.prerequisites || '', learningOutcomes: form.learningOutcomes || '',
    };
    try {
      const { data } = course ? await api.patch(`/admin/courses/${course.id}`, body) : await api.post('/admin/courses', body);
      toast.success(course ? 'Course updated' : 'Course added');
      onSaved?.(data.course);
      onClose();
    } catch (err) {
      setError(apiError(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <FormBanner tone="error" title="Could not save">{error}</FormBanner>}
      <Field label="Course image" hint="Shown on the website course card. A wide (landscape) image looks best.">
        <ImageUpload
          value={form.image}
          onChange={(image) => setForm((prev) => ({ ...prev, image }))}
          folder="courses"
          shape="wide"
          maxSide={1200}
          disabled={saving}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Code" required hint="e.g. DCA"><Input value={form.courseCode} onChange={set('courseCode')} className="uppercase" /></Field>
        <Field label="Course name" required className="sm:col-span-2"><Input value={form.courseName} onChange={set('courseName')} /></Field>
        <Field label="Duration (months)" required><Input type="number" min="1" value={form.durationMonths} onChange={set('durationMonths')} /></Field>
        <Field label="Type">
          <Select value={form.courseType} onChange={set('courseType')}>
            {COURSE_TYPES.map((t) => <option key={t} value={t}>{labelize(t)}</option>)}
          </Select>
        </Field>
        <Field label="Level">
          <Select value={form.level} onChange={set('level')}>
            {COURSE_LEVELS.map((t) => <option key={t} value={t}>{labelize(t)}</option>)}
          </Select>
        </Field>
        <Field label="Course fee (₹)" required><Input type="number" min="0" value={form.baseFee} onChange={set('baseFee')} /></Field>
        <Field label="Admission fee (₹)"><Input type="number" min="0" value={form.admissionFee} onChange={set('admissionFee')} /></Field>
        <Field label="Exam fee (₹)"><Input type="number" min="0" value={form.examFee} onChange={set('examFee')} /></Field>
        <Field label="Status">
          <Select value={form.status} onChange={set('status')}>
            {ENTITY_STATUSES.map((t) => <option key={t} value={t}>{labelize(t)}</option>)}
          </Select>
        </Field>
        <Field label="Website slug" hint="Used by the website enquiry form"><Input value={form.slug || ''} onChange={set('slug')} placeholder="e.g. dca-adca" /></Field>
        <Field label="Sort order"><Input type="number" value={form.sortOrder} onChange={set('sortOrder')} /></Field>
      </div>
      <Field label="Short description"><Input value={form.shortDescription || ''} onChange={set('shortDescription')} /></Field>
      <Field label="About the course"><Textarea rows={3} value={form.description || ''} onChange={set('description')} /></Field>
      <Field label="Syllabus" hint="One topic per line — shown as a numbered list.">
        <Textarea rows={5} value={form.syllabus || ''} onChange={set('syllabus')} placeholder={'Computer fundamentals\nMS Word\nMS Excel\nInternet & email'} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Prerequisites" hint="Who can join"><Textarea rows={3} value={form.prerequisites || ''} onChange={set('prerequisites')} placeholder="e.g. Class 8 passed, basic English" /></Field>
        <Field label="What students will learn" hint="One point per line"><Textarea rows={3} value={form.learningOutcomes || ''} onChange={set('learningOutcomes')} /></Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" size="sm" loading={saving}>{course ? 'Save changes' : 'Add course'}</Button>
      </div>
    </form>
  );
}

export default function CourseFormModal({ open, course, onOpenChange, onSaved }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={course ? 'Edit course' : 'Add course'} className="max-w-2xl">
      {open && <CourseForm key={course?.id || 'new'} course={course} onClose={() => onOpenChange(false)} onSaved={onSaved} />}
    </Modal>
  );
}
