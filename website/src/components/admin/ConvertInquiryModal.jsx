import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { FormBanner } from '../ui/FormBanner';
import Field, { FormSection } from './Field';
import EnrollmentFields, { emptyEnrollment, emptyFee, enrollmentPayload, validateFee } from './EnrollmentFields';
import { GENDERS } from '../../constants/institute';
import { labelize, todayInput, toInputDate } from '../../lib/format';
import { useCourseOptions, useOpenBatches } from '../../hooks/useAcademics';
import api, { apiError } from '../../lib/api';

function ConvertForm({ inquiry, courses, batches, onClose, onSaved }) {
  const courseId = inquiry.courseId?.id || inquiry.courseId || '';
  const course = courses.find((row) => row.id === courseId);
  const [student, setStudent] = useState({
    name: inquiry.name || '',
    phone: inquiry.phone || '',
    gender: inquiry.gender || '',
    fatherName: inquiry.fatherName || '',
    dob: toInputDate(inquiry.dob),
    admissionDate: todayInput(),
  });
  const [enrollNow, setEnrollNow] = useState(Boolean(course));
  const [enrollment, setEnrollment] = useState(() =>
    course ? { ...emptyEnrollment(), courseId: course.id, fee: emptyFee(course) } : emptyEnrollment()
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) => setStudent((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async () => {
    if (!student.name.trim() || !student.phone.trim()) return setError('Name and phone are required');
    if (!student.gender) return setError('Select gender');
    if (enrollNow) {
      if (!enrollment.courseId) return setError('Select a course or turn off “Enroll now”');
      const feeError = validateFee(enrollment.fee);
      if (feeError) return setError(feeError);
    }
    setError('');
    setSaving(true);
    try {
      const body = { ...student, dob: student.dob || undefined };
      if (enrollNow) body.enrollment = enrollmentPayload(enrollment);
      const { data } = await api.post(`/admin/inquiries/${inquiry.id}/convert`, body);
      toast.success(`Admitted as ${data.student.studentId}`);
      onSaved?.(data);
      onClose();
    } catch (err) {
      setError(apiError(err));
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-5">
        {error && <FormBanner tone="error" title="Could not admit">{error}</FormBanner>}
        <FormSection title="Student details" description={`From ${inquiry.inquiryNumber}${inquiry.preferredBatch ? ` · prefers ${inquiry.preferredBatch}` : ''}`}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Name" required><Input value={student.name} onChange={set('name')} /></Field>
            <Field label="Phone" required><Input value={student.phone} onChange={set('phone')} inputMode="tel" /></Field>
            <Field label="Gender" required>
              <Select value={student.gender} onChange={set('gender')}>
                <option value="">Select</option>
                {GENDERS.map((g) => <option key={g} value={g}>{labelize(g)}</option>)}
              </Select>
            </Field>
            <Field label="Father's name"><Input value={student.fatherName} onChange={set('fatherName')} /></Field>
            <Field label="Date of birth"><Input type="date" value={student.dob} onChange={set('dob')} /></Field>
            <Field label="Admission date"><Input type="date" value={student.admissionDate} onChange={set('admissionDate')} /></Field>
          </div>
        </FormSection>

        <FormSection title="Enrollment">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={enrollNow} onChange={(event) => setEnrollNow(event.target.checked)} />
            Enroll in a course now
          </label>
          {enrollNow && <EnrollmentFields value={enrollment} onChange={setEnrollment} courses={courses} batches={batches} />}
        </FormSection>
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button size="sm" onClick={submit} loading={saving}>Admit student</Button>
      </div>
    </>
  );
}

export default function ConvertInquiryModal({ inquiry, onOpenChange, onSaved }) {
  const courses = useCourseOptions();
  const { batches } = useOpenBatches();
  return (
    <Modal
      open={Boolean(inquiry)}
      onOpenChange={onOpenChange}
      title="Admit as student"
      description={inquiry ? `${inquiry.name} · ${inquiry.phone}` : undefined}
      className="max-w-2xl"
    >
      {inquiry && (
        <ConvertForm
          key={`${inquiry.id}-${courses.length}`}
          inquiry={inquiry}
          courses={courses}
          batches={batches}
          onClose={() => onOpenChange(false)}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
}
