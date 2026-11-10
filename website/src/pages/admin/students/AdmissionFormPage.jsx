import { useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Loader';
import { FormBanner } from '../../../components/ui/FormBanner';
import PageHeader from '../../../components/admin/PageHeader';
import BrandLogo from '../../../components/brand/BrandLogo';
import { BUSINESSES } from '../../../constants/site';
import { ageFromDob, formatDate, formatINR, formatTiming, initials, labelize, yesNo } from '../../../lib/format';
import { mediaUrl } from '../../../lib/api';
import { useApi } from '../../../hooks/useApi';

function Line({ label, value, wide }) {
  return (
    <div className={wide ? 'col-span-2' : undefined}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="min-h-[1.4rem] border-b border-dotted border-slate-300 pb-0.5 text-sm font-medium">{value || ''}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-2.5">
      <h3 className="rounded bg-blue-950 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-white">{title}</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-4">{children}</div>
    </section>
  );
}

export default function AdmissionFormPage() {
  const { id } = useParams();
  const { data, loading, error } = useApi(`/admin/students/${id}`);

  if (loading && !data) return <Skeleton className="mx-auto h-[40rem] w-full max-w-3xl" />;
  if (error) return <FormBanner tone="error" title="Could not load student">{error}</FormBanner>;
  if (!data) return null;
  const { student, enrollments } = data;
  const age = ageFromDob(student.dob);
  const current = enrollments.find((row) => ['enrolled', 'in_progress'].includes(row.status)) || enrollments[0];
  const fee = current?.fee;

  return (
    <div className="space-y-3">
      <div className="no-print">
        <PageHeader
          back={{ to: `/students/${student.id}`, label: 'Back to profile' }}
          title="Admission form"
          description={`${student.name} · ${student.studentId}`}
          actions={<Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" />Print</Button>}
        />
      </div>

      <div className="receipt-sheet mx-auto max-w-3xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-lg sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b-2 border-blue-950 pb-4">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-14 w-14" alt={BUSINESSES.institute.name} />
            <div>
              <p className="text-xl font-extrabold tracking-tight text-blue-950">{BUSINESSES.institute.name}</p>
              <p className="text-xs text-slate-500">{BUSINESSES.institute.address}</p>
              <p className="text-xs text-slate-500">{BUSINESSES.institute.phone} · {BUSINESSES.institute.email}</p>
            </div>
          </div>
          <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-300 bg-slate-50 text-[10px] text-slate-400">
            {student.photo ? (
              <img src={mediaUrl(student.photo)} alt={student.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-center">Paste<br />photo<br />({initials(student.name)})</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-bold uppercase tracking-wide text-blue-950">Student admission form</h2>
          <div className="text-right text-sm">
            <p>Student ID: <b>{student.studentId}</b></p>
            <p>Admission date: <b>{formatDate(student.admissionDate)}</b></p>
          </div>
        </div>

        <Section title="Personal details">
          <Line label="Full name" value={student.name} wide />
          <Line label="Gender" value={student.gender && labelize(student.gender)} />
          <Line label="Date of birth / Age" value={student.dob ? `${formatDate(student.dob)}${age !== null ? ` (${age} yrs)` : ''}` : ''} />
          <Line label="Mobile" value={student.phone} />
          <Line label="Email" value={student.email} />
          <Line label="ID number" value={student.idNumber} wide />
        </Section>

        <Section title="Family & address">
          <Line label="Father's name" value={student.fatherName} wide />
          <Line label="Mother's name" value={student.motherName} wide />
          <Line label="Guardian" value={student.parentName && `${student.parentName}${student.guardianRelation ? ` (${student.guardianRelation})` : ''}`} wide />
          <Line label="Guardian mobile" value={student.parentMobile} />
          <Line label="City" value={student.city} />
          <div className="col-span-2 sm:col-span-4"><Line label="Address" value={student.address} /></div>
        </Section>

        <Section title="Education & background">
          <Line label="Qualification" value={student.qualification} />
          <Line label="School / College" value={student.schoolName} />
          <Line label="Computer at home" value={student.computerAtHome === undefined || student.computerAtHome === null ? '' : yesNo(student.computerAtHome)} />
          <Line label="Previous computer course" value={student.previousCourse === undefined || student.previousCourse === null ? '' : yesNo(student.previousCourse)} />
        </Section>

        <Section title="Course & fee">
          <Line label="Course" value={current?.courseId?.courseName || student.courseId?.courseName} wide />
          <Line label="Duration" value={current?.courseId?.durationMonths ? `${current.courseId.durationMonths} months` : ''} />
          <Line label="Enrollment no" value={current?.enrollmentNumber} />
          <Line label="Batch / timing" value={current?.batchId ? `${current.batchId.batchName} · ${formatTiming(current.batchId.timingFrom, current.batchId.timingTo)}` : ''} wide />
          <Line label="Start date" value={current && formatDate(current.enrollmentDate)} />
          <Line label="Expected completion" value={current && formatDate(current.expectedCompletionDate)} />
          <Line label="Net fee" value={fee && formatINR(fee.netFee)} />
          <Line label="Paid" value={fee && formatINR(fee.totalPaid)} />
          <Line label="Balance" value={fee && formatINR(fee.balance)} />
          <Line label="Payment plan" value={fee && (fee.installmentProgress?.length > 1 ? `${fee.installmentProgress.length} installments` : 'One-time')} />
        </Section>

        {fee?.installmentProgress?.length > 1 && (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border border-slate-200 px-2 py-1">#</th>
                <th className="border border-slate-200 px-2 py-1">Due date</th>
                <th className="border border-slate-200 px-2 py-1 text-right">Amount</th>
                <th className="border border-slate-200 px-2 py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {fee.installmentProgress.map((inst) => (
                <tr key={inst.number}>
                  <td className="border border-slate-200 px-2 py-1">{inst.number}</td>
                  <td className="border border-slate-200 px-2 py-1">{formatDate(inst.dueDate)}</td>
                  <td className="border border-slate-200 px-2 py-1 text-right">{formatINR(inst.amount)}</td>
                  <td className="border border-slate-200 px-2 py-1">{labelize(inst.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <section className="space-y-1.5 text-[11px] leading-relaxed text-slate-600">
          <h3 className="font-bold uppercase tracking-wide text-slate-800">Declaration</h3>
          <p>
            I confirm that the information given above is true. I will follow the rules of the institute, attend classes regularly
            and pay the fee on or before the due dates. Fees once paid are not refundable or transferable.
          </p>
        </section>

        <div className="grid grid-cols-3 gap-6 pt-10 text-center text-[11px] text-slate-500">
          <div className="border-t border-slate-400 pt-1">Student signature</div>
          <div className="border-t border-slate-400 pt-1">Guardian signature</div>
          <div className="border-t border-slate-400 pt-1">Authorised signatory</div>
        </div>
      </div>
    </div>
  );
}
