import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Card, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import { FormBanner } from '../../../components/ui/FormBanner';
import { Skeleton } from '../../../components/ui/Loader';
import PageHeader from '../../../components/admin/PageHeader';
import Field, { FormSection } from '../../../components/admin/Field';
import EnrollmentFields, { emptyEnrollment, enrollmentPayload, validateFee } from '../../../components/admin/EnrollmentFields';
import { GENDERS, GUARDIAN_RELATIONS, QUALIFICATIONS, STUDENT_STATUSES } from '../../../constants/institute';
import ImageUpload from '../../../components/admin/ImageUpload';
import { ageFromDob, initials, labelize, todayInput, toInputDate } from '../../../lib/format';
import { useApi } from '../../../hooks/useApi';
import { useCourseOptions, useOpenBatches } from '../../../hooks/useAcademics';
import api, { apiError } from '../../../lib/api';

const EMPTY = {
  photo: '', name: '', phone: '', email: '', gender: '', dob: '', fatherName: '', motherName: '', qualification: '', schoolName: '',
  address: '', city: '', parentName: '', guardianRelation: '', parentMobile: '', idNumber: '', computerAtHome: '', previousCourse: '',
  admissionDate: todayInput(), status: 'active', remarks: '',
};
const toYesNo = (value) => (value === true ? 'yes' : value === false ? 'no' : '');
const PHONE = /^[0-9+\s-]{10,15}$/;

function fromStudent(student) {
  const out = { ...EMPTY };
  for (const key of Object.keys(EMPTY)) if (student[key] !== undefined && student[key] !== null) out[key] = student[key];
  out.computerAtHome = toYesNo(student.computerAtHome);
  out.previousCourse = toYesNo(student.previousCourse);
  out.dob = toInputDate(student.dob);
  out.admissionDate = toInputDate(student.admissionDate);
  return out;
}

function StudentForm({ student, courses, batches }) {
  const navigate = useNavigate();
  const isEdit = Boolean(student);
  const [form, setForm] = useState(() => (student ? fromStudent(student) : EMPTY));
  const [enrollNow, setEnrollNow] = useState(!isEdit);
  const [enrollment, setEnrollment] = useState(emptyEnrollment);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const age = ageFromDob(form.dob);
  const qualificationOptions = form.qualification && !QUALIFICATIONS.includes(form.qualification)
    ? [form.qualification, ...QUALIFICATIONS]
    : QUALIFICATIONS;

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Required';
    if (!PHONE.test(form.phone.trim())) next.phone = 'Enter a valid 10-digit phone';
    if (!form.gender) next.gender = 'Required';
    if (form.parentMobile && !PHONE.test(form.parentMobile.trim())) next.parentMobile = 'Invalid phone';
    if (!isEdit && enrollNow && !enrollment.courseId) next.courseId = 'Select a course or untick “Enroll now”';
    setErrors(next);
    const feeError = !isEdit && enrollNow && enrollment.courseId ? validateFee(enrollment.fee) : '';
    if (Object.keys(next).length || feeError) {
      setFormError(feeError || 'Please fix the highlighted fields.');
      return;
    }
    setFormError('');
    setSaving(true);
    const body = { ...form, dob: form.dob || null };
    try {
      if (isEdit) {
        await api.patch(`/admin/students/${student.id}`, body);
        toast.success('Student updated');
        navigate(`/students/${student.id}`);
      } else {
        if (enrollNow) body.enrollment = enrollmentPayload(enrollment);
        delete body.status;
        const { data } = await api.post('/admin/students', body);
        toast.success(`Admission done · ${data.student.studentId}`);
        navigate(`/students/${data.student.id}`);
      }
    } catch (err) {
      setFormError(apiError(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      {formError && <FormBanner tone="error" title="Could not save">{formError}</FormBanner>}
      <Card>
        <CardContent className="space-y-6 pt-4">
          <FormSection title="Personal details">
            <Field label="Photo">
              <ImageUpload
                value={form.photo}
                onChange={(photo) => setForm((prev) => ({ ...prev, photo }))}
                folder="students"
                fallback={form.name.trim() ? initials(form.name) : ''}
                disabled={saving}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Full name" required error={errors.name}><Input value={form.name} onChange={set('name')} autoFocus={!isEdit} /></Field>
              <Field label="Mobile" required error={errors.phone}><Input value={form.phone} onChange={set('phone')} inputMode="tel" /></Field>
              <Field label="Gender" required error={errors.gender}>
                <Select value={form.gender} onChange={set('gender')}>
                  <option value="">Select</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{labelize(g)}</option>)}
                </Select>
              </Field>
              <Field label="Date of birth" hint={age !== null ? `Age ${age} years` : undefined}>
                <Input type="date" value={form.dob} onChange={set('dob')} max={todayInput()} />
              </Field>
              <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} /></Field>
              <Field label="Qualification">
                <Select value={form.qualification} onChange={set('qualification')}>
                  <option value="">Select</option>
                  {qualificationOptions.map((q) => <option key={q} value={q}>{q}</option>)}
                </Select>
              </Field>
              <Field label="School / College"><Input value={form.schoolName} onChange={set('schoolName')} /></Field>
              <Field label="Father's name"><Input value={form.fatherName} onChange={set('fatherName')} /></Field>
              <Field label="Mother's name"><Input value={form.motherName} onChange={set('motherName')} /></Field>
              <Field label="ID number" hint="Aadhaar / citizenship / school ID"><Input value={form.idNumber} onChange={set('idNumber')} /></Field>
              <Field label="Computer at home">
                <Select value={form.computerAtHome} onChange={set('computerAtHome')}>
                  <option value="">Not asked</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
              </Field>
              <Field label="Learned a computer course before">
                <Select value={form.previousCourse} onChange={set('previousCourse')}>
                  <option value="">Not asked</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
              </Field>
            </div>
          </FormSection>

          <FormSection title="Contact & guardian">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Address" className="sm:col-span-2"><Input value={form.address} onChange={set('address')} /></Field>
              <Field label="City"><Input value={form.city} onChange={set('city')} /></Field>
              <Field label="Guardian name"><Input value={form.parentName} onChange={set('parentName')} /></Field>
              <Field label="Relation">
                <Select value={form.guardianRelation} onChange={set('guardianRelation')}>
                  <option value="">Select</option>
                  {GUARDIAN_RELATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
              </Field>
              <Field label="Guardian mobile" error={errors.parentMobile}><Input value={form.parentMobile} onChange={set('parentMobile')} inputMode="tel" /></Field>
            </div>
          </FormSection>

          <FormSection title="Admission">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Admission date"><Input type="date" value={form.admissionDate} onChange={set('admissionDate')} /></Field>
              {isEdit && (
                <Field label="Status">
                  <Select value={form.status} onChange={set('status')}>
                    {STUDENT_STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
                  </Select>
                </Field>
              )}
            </div>
            <Field label="Remarks"><Textarea rows={2} value={form.remarks} onChange={set('remarks')} /></Field>
          </FormSection>

          {!isEdit && (
            <FormSection title="Course enrollment" description="Enroll now to create the fee structure and installments right away.">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={enrollNow} onChange={(e) => setEnrollNow(e.target.checked)} />
                Enroll in a course now
              </label>
              {enrollNow && <EnrollmentFields value={enrollment} onChange={setEnrollment} courses={courses} batches={batches} errors={errors} />}
            </FormSection>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={saving}>Cancel</Button>
        <Button type="submit" loading={saving}>{isEdit ? 'Save changes' : 'Save admission'}</Button>
      </div>
    </form>
  );
}

export default function StudentFormPage() {
  const { id } = useParams();
  const courses = useCourseOptions();
  const { batches } = useOpenBatches();
  const { data, loading, error } = useApi(id ? `/admin/students/${id}` : null);

  return (
    <div className="space-y-3">
      <PageHeader
        title={id ? 'Edit student' : 'New admission'}
        description={id ? data?.student && `${data.student.name} · ${data.student.studentId}` : 'Admit a walk-in student and optionally enroll in a course.'}
        back={id ? { to: `/students/${id}`, label: 'Back to profile' } : { to: '/students', label: 'Students' }}
      />
      {id && loading && !data ? (
        <Skeleton className="h-96 w-full" />
      ) : id && error ? (
        <FormBanner tone="error" title="Could not load student">{error}</FormBanner>
      ) : (
        <StudentForm key={data?.student?.id || 'new'} student={data?.student} courses={courses} batches={batches} />
      )}
    </div>
  );
}
