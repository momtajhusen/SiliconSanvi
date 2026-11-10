import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import { FormBanner } from '../ui/FormBanner';
import Field, { FormSection } from './Field';
import {
  ENQUIRY_TYPES, GENDERS, LEAD_PRIORITIES, LEAD_SOURCES, PREFERRED_BATCHES, QUALIFICATIONS,
} from '../../constants/institute';
import { labelize, toInputDate } from '../../lib/format';
import { useCourseOptions } from '../../hooks/useAcademics';
import api, { apiError } from '../../lib/api';

const EMPTY = {
  name: '', phone: '', email: '', enquiryType: 'course', courseId: '', courseInterest: '', preferredBatch: '',
  leadSource: 'walk-in', priority: 'warm', status: 'new', followUpDate: '', gender: '', fatherName: '',
  qualification: '', schoolName: '', age: '', parentMobile: '', computerAtHome: '', previousCourse: '', address: '', remarks: '',
};

const boolToSelect = (value) => (value === true ? 'yes' : value === false ? 'no' : '');
const selectToBool = (value) => (value === 'yes' ? true : value === 'no' ? false : null);

export function detailText(details) {
  if (!details || typeof details !== 'object') return '';
  return Object.entries(details)
    .filter(([, v]) => v)
    .map(([k, v]) => `${labelize(k)}: ${v}`)
    .join(' · ');
}

function fromInquiry(inquiry) {
  if (!inquiry) return EMPTY;
  const out = { ...EMPTY };
  for (const key of Object.keys(EMPTY)) if (inquiry[key] !== undefined && inquiry[key] !== null) out[key] = inquiry[key];
  out.courseId = inquiry.courseId?.id || inquiry.courseId || '';
  out.followUpDate = toInputDate(inquiry.followUpDate);
  out.computerAtHome = boolToSelect(inquiry.computerAtHome);
  out.previousCourse = boolToSelect(inquiry.previousCourse);
  out.age = inquiry.age ?? '';
  return out;
}

function InquiryFormBody({ inquiry, onClose, onSaved }) {
  const courses = useCourseOptions();
  const [form, setForm] = useState(() => fromInquiry(inquiry));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const isCourse = form.enquiryType === 'course';

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return setError('Name and phone are required');
    if (form.age !== '' && !(Number(form.age) >= 0 && Number(form.age) < 120)) return setError('Enter a valid age');
    setError('');
    setSaving(true);
    const body = {
      name: form.name, phone: form.phone, email: form.email, enquiryType: form.enquiryType,
      courseId: isCourse ? form.courseId || null : null,
      courseInterest: form.courseInterest, preferredBatch: isCourse ? form.preferredBatch : '', leadSource: form.leadSource,
      priority: form.priority, followUpDate: form.followUpDate || null, address: form.address, remarks: form.remarks,
    };
    if (isCourse) {
      Object.assign(body, {
        gender: form.gender, fatherName: form.fatherName, qualification: form.qualification, schoolName: form.schoolName,
        age: form.age === '' ? null : Number(form.age), parentMobile: form.parentMobile,
        computerAtHome: selectToBool(form.computerAtHome), previousCourse: selectToBool(form.previousCourse),
      });
    }
    if (form.status !== 'converted') body.status = form.status;
    try {
      const { data } = inquiry
        ? await api.patch(`/admin/inquiries/${inquiry.id}`, body)
        : await api.post('/admin/inquiries', body);
      toast.success(inquiry ? 'Inquiry updated' : `Inquiry added · ${data.inquiry.inquiryNumber}`);
      onSaved?.(data.inquiry);
      onClose();
    } catch (err) {
      setError(apiError(err));
      setSaving(false);
    }
  };

  const extra = detailText(inquiry?.details);

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && <FormBanner tone="error" title="Could not save">{error}</FormBanner>}
      {extra && <p className="rounded-lg bg-[hsl(var(--color-muted))]/60 px-3 py-2 text-xs text-muted-foreground">{extra}</p>}

      <FormSection title="Contact">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Name" required><Input value={form.name} onChange={set('name')} autoFocus={!inquiry} /></Field>
          <Field label="Phone" required><Input value={form.phone} onChange={set('phone')} inputMode="tel" /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} /></Field>
          <Field label="Address" className="sm:col-span-3"><Input value={form.address} onChange={set('address')} /></Field>
        </div>
      </FormSection>

      <FormSection title="Interest">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Enquiry for">
            <Select value={form.enquiryType} onChange={set('enquiryType')}>
              {ENQUIRY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          {isCourse ? (
            <>
              <Field label="Course">
                <Select value={form.courseId} onChange={set('courseId')}>
                  <option value="">Not decided</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.courseName}</option>)}
                </Select>
              </Field>
              <Field label="Preferred batch">
                <Select value={form.preferredBatch} onChange={set('preferredBatch')}>
                  <option value="">Any</option>
                  {PREFERRED_BATCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </Select>
              </Field>
              <Field label="Other course interest" className="sm:col-span-3">
                <Input value={form.courseInterest} onChange={set('courseInterest')} placeholder="e.g. wants Excel + Tally together" />
              </Field>
            </>
          ) : (
            <Field label="Requirement" className="sm:col-span-2">
              <Input value={form.courseInterest} onChange={set('courseInterest')} placeholder="e.g. 4 camera setup for shop" />
            </Field>
          )}
        </div>
      </FormSection>

      {isCourse && (
        <FormSection title="Student details">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Gender">
              <Select value={form.gender || ''} onChange={set('gender')}>
                <option value="">—</option>
                {GENDERS.map((g) => <option key={g} value={g}>{labelize(g)}</option>)}
              </Select>
            </Field>
            <Field label="Age"><Input type="number" min="0" max="120" value={form.age} onChange={set('age')} /></Field>
            <Field label="Qualification">
              <Select value={form.qualification || ''} onChange={set('qualification')}>
                <option value="">—</option>
                {form.qualification && !QUALIFICATIONS.includes(form.qualification) && <option value={form.qualification}>{form.qualification}</option>}
                {QUALIFICATIONS.map((q) => <option key={q} value={q}>{q}</option>)}
              </Select>
            </Field>
            <Field label="School / College"><Input value={form.schoolName || ''} onChange={set('schoolName')} /></Field>
            <Field label="Father's name"><Input value={form.fatherName || ''} onChange={set('fatherName')} /></Field>
            <Field label="Parent mobile"><Input value={form.parentMobile || ''} onChange={set('parentMobile')} inputMode="tel" /></Field>
            <Field label="Computer / laptop at home?">
              <Select value={form.computerAtHome} onChange={set('computerAtHome')}>
                <option value="">—</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </Select>
            </Field>
            <Field label="Learned a computer course before?">
              <Select value={form.previousCourse} onChange={set('previousCourse')}>
                <option value="">—</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </Select>
            </Field>
          </div>
        </FormSection>
      )}

      <FormSection title="Follow-up">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Source">
            <Select value={form.leadSource} onChange={set('leadSource')}>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={set('priority')}>
              {LEAD_PRIORITIES.map((p) => <option key={p} value={p}>{labelize(p)}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={set('status')} disabled={form.status === 'converted'}>
              <option value="new">New</option>
              <option value="in-process">In process</option>
              <option value="closed">Closed</option>
              {form.status === 'converted' && <option value="converted">Converted</option>}
            </Select>
          </Field>
          <Field label="Next follow-up"><Input type="date" value={form.followUpDate} onChange={set('followUpDate')} /></Field>
        </div>
        <Field label="Remarks"><Textarea rows={2} value={form.remarks || ''} onChange={set('remarks')} /></Field>
      </FormSection>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" size="sm" loading={saving}>{inquiry ? 'Save changes' : 'Add inquiry'}</Button>
      </div>
    </form>
  );
}

/** `inquiry` = null for a new inquiry; pass `open` to control visibility. */
export default function InquiryFormModal({ open, inquiry, onOpenChange, onSaved }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={inquiry ? `Edit inquiry ${inquiry.inquiryNumber || ''}` : 'Add inquiry'} className="max-w-3xl">
      {open && <InquiryFormBody key={inquiry?.id || 'new'} inquiry={inquiry} onClose={() => onOpenChange(false)} onSaved={onSaved} />}
    </Modal>
  );
}
