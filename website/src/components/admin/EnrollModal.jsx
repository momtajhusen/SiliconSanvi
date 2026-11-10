import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FormBanner } from '../ui/FormBanner';
import Field from './Field';
import StudentPicker from './StudentPicker';
import EnrollmentFields, { emptyEnrollment, emptyFee, enrollmentPayload, validateFee } from './EnrollmentFields';
import { useCourseOptions, useOpenBatches } from '../../hooks/useAcademics';
import api, { apiError } from '../../lib/api';

function initialValue(courses, defaultCourseId) {
  const base = emptyEnrollment();
  const course = courses.find((row) => row.id === defaultCourseId);
  return course ? { ...base, courseId: course.id, fee: emptyFee(course) } : base;
}

function EnrollForm({ student: fixedStudent, defaultCourseId, courses, batches, onClose, onSaved }) {
  const [student, setStudent] = useState(fixedStudent || null);
  const [value, setValue] = useState(() => initialValue(courses, defaultCourseId));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!student) return setError('Select a student');
    if (!value.courseId) return setError('Select a course');
    const feeError = validateFee(value.fee);
    if (feeError) return setError(feeError);
    setError('');
    setSaving(true);
    try {
      const { data } = await api.post('/admin/enrollments', { ...enrollmentPayload(value), studentId: student.id });
      toast.success(`Enrolled · ${data.enrollment.enrollmentNumber}`);
      onSaved?.(data);
      onClose();
    } catch (err) {
      setError(apiError(err));
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {error && <FormBanner tone="error" title="Could not enroll">{error}</FormBanner>}
        {!fixedStudent && (
          <Field label="Student" required>
            <StudentPicker value={student} onChange={setStudent} autoFocus />
          </Field>
        )}
        <EnrollmentFields value={value} onChange={setValue} courses={courses} batches={batches} />
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button size="sm" onClick={submit} loading={saving}>Enroll student</Button>
      </div>
    </>
  );
}

export default function EnrollModal({ open, onOpenChange, student, defaultCourseId, onSaved }) {
  const courses = useCourseOptions();
  const { batches } = useOpenBatches();
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={student ? `Enroll ${student.name}` : 'New enrollment'}
      description="Pick the course and batch. A fee structure is created automatically."
      className="max-w-2xl"
    >
      {open && (
        <EnrollForm
          key={`${student?.id || 'new'}-${courses.length}`}
          student={student}
          defaultCourseId={defaultCourseId}
          courses={courses}
          batches={batches}
          onClose={() => onOpenChange(false)}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
}
