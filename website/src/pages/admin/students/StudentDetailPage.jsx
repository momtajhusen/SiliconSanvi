import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  BookPlus, ExternalLink, FileText, IndianRupee, MessageCircle, Pencil, Phone, Printer, Receipt, Trash2, Upload,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Avatar from '../../../components/ui/Avatar';
import KpiCard from '../../../components/ui/KpiCard';
import { Skeleton } from '../../../components/ui/Loader';
import { FormBanner } from '../../../components/ui/FormBanner';
import PageHeader from '../../../components/admin/PageHeader';
import StatusBadge from '../../../components/admin/StatusBadge';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import Field from '../../../components/admin/Field';
import Info, { InfoGrid } from '../../../components/admin/Info';
import PillTabs from '../../../components/admin/PillTabs';
import EnrollModal from '../../../components/admin/EnrollModal';
import EditEnrollmentModal from '../../../components/admin/EditEnrollmentModal';
import PaymentModal from '../../../components/admin/PaymentModal';
import { DOCUMENT_TYPES, STUDENT_STATUSES, paymentModeLabel } from '../../../constants/institute';
import { BUSINESSES } from '../../../constants/site';
import {
  ageFromDob, formatDate, formatDateTime, formatINR, formatTiming, initials, labelize, whatsappLink, yesNo,
} from '../../../lib/format';
import { useApi } from '../../../hooks/useApi';
import api, { apiError, mediaUrl, uploadFile } from '../../../lib/api';

const DOC_LABEL = Object.fromEntries(DOCUMENT_TYPES.map((d) => [d.value, d.label]));
const MAX_DOC_MB = 5;

function EnrollmentCard({ row, onEdit, onPay }) {
  const fee = row.fee;
  const paidPct = fee?.netFee ? Math.min(100, Math.round((fee.totalPaid / fee.netFee) * 100)) : 0;
  return (
    <div className="rounded-xl border border-[hsl(var(--color-border-premium))] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to={`/enrollments/${row.id}`} className="font-semibold hover:underline">{row.courseId?.courseName}</Link>
          <p className="text-xs text-muted-foreground">
            {row.enrollmentNumber} · {row.batchId ? `${row.batchId.batchName} (${formatTiming(row.batchId.timingFrom, row.batchId.timingTo)})` : 'No batch assigned'}
          </p>
          <p className="text-xs text-muted-foreground">
            Enrolled {formatDate(row.enrollmentDate)} · Expected {formatDate(row.expectedCompletionDate)} · Progress {row.progressPercentage || 0}%
            {row.actualCompletionDate ? ` · Completed ${formatDate(row.actualCompletionDate)}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge status={row.status} />
          <Button size="sm" variant="ghost" onClick={onEdit} aria-label="Edit enrollment"><Pencil className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {fee ? (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>
              Paid <b>{formatINR(fee.totalPaid)}</b> of {formatINR(fee.netFee)}
              {fee.balance > 0 && <span className="text-amber-600"> · Balance {formatINR(fee.balance)}</span>}
            </span>
            <div className="flex items-center gap-1.5">
              <StatusBadge status={fee.feeStatus} />
              <Link to={`/finance/fees/${fee.id}`} className="text-xs font-medium text-blue-600 hover:underline">Fee details</Link>
            </div>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[hsl(var(--color-muted))]">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${paidPct}%` }} />
          </div>
          {fee.installmentProgress?.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {fee.installmentProgress.map((inst) => (
                <span key={inst.number} className="inline-flex items-center gap-1 rounded-md border border-[hsl(var(--color-border-premium))] px-2 py-1 text-[11px]">
                  #{inst.number} {formatINR(inst.amount)} · {formatDate(inst.dueDate)}
                  <StatusBadge status={inst.status} className="px-1.5 py-0 text-[10px]" />
                </span>
              ))}
            </div>
          )}
          {fee.balance > 0 && (
            <Button size="sm" variant="outline" onClick={onPay}><IndianRupee className="h-3.5 w-3.5" />Collect {formatINR(fee.nextDueAmount || fee.balance)}</Button>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">No fee structure.</p>
      )}
    </div>
  );
}

function DocumentsPanel({ student, onChanged }) {
  const fileRef = useRef(null);
  const [docType, setDocType] = useState('id_proof');
  const [name, setName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);
  const documents = student.documents || [];

  const pick = (event) => {
    const next = event.target.files?.[0];
    event.target.value = '';
    if (!next) return;
    if (next.size > MAX_DOC_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_DOC_MB} MB`);
      return;
    }
    setFile(next);
    if (!name) setName(next.name.replace(/\.[^.]+$/, ''));
  };

  const save = async (event) => {
    event.preventDefault();
    if (!file) return toast.error('Choose a file first');
    setSaving(true);
    try {
      const url = await uploadFile(file, 'documents');
      await api.post(`/admin/students/${student.id}/documents`, { docType, name: name || DOC_LABEL[docType], url, remarks });
      toast.success('Document uploaded');
      setFile(null);
      setName('');
      setRemarks('');
      onChanged();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/admin/students/${student.id}/documents/${removing.id || removing._id}`);
      toast.success('Document removed');
      setRemoving(null);
      onChanged();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="space-y-3 rounded-xl border border-dashed border-[hsl(var(--color-border-premium))] p-3">
        <div className="grid gap-2.5 sm:grid-cols-3">
          <Field label="Document type">
            <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
              {DOCUMENT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </Select>
          </Field>
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aadhaar card" /></Field>
          <Field label="Remarks"><Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" /></Field>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={pick} />
          <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={saving}>
            <FileText className="h-4 w-4" />{file ? 'Change file' : 'Choose file'}
          </Button>
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : `JPG, PNG, WEBP or PDF · up to ${MAX_DOC_MB} MB`}
          </span>
          <Button type="submit" size="sm" loading={saving} disabled={!file}><Upload className="h-4 w-4" />Upload</Button>
        </div>
      </form>

      {documents.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No documents uploaded yet.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {documents.map((doc) => {
            const isPdf = /\.pdf$/i.test(doc.url);
            return (
              <div key={doc.id || doc._id} className="flex items-center gap-3 rounded-xl border border-[hsl(var(--color-border-premium))] p-2.5">
                <a href={mediaUrl(doc.url)} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  {isPdf ? (
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-500/10 text-[11px] font-bold text-rose-600">PDF</span>
                  ) : (
                    <img src={mediaUrl(doc.url)} alt={doc.name} className="h-12 w-12 rounded-lg object-cover" loading="lazy" />
                  )}
                </a>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.name || DOC_LABEL[doc.docType]}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {DOC_LABEL[doc.docType] || labelize(doc.docType)} · {formatDate(doc.uploadedAt)}{doc.remarks ? ` · ${doc.remarks}` : ''}
                  </p>
                </div>
                <a href={mediaUrl(doc.url)} target="_blank" rel="noopener noreferrer" className="rounded-md p-1.5 text-muted-foreground hover:text-foreground" aria-label="Open">
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button type="button" onClick={() => setRemoving(doc)} className="rounded-md p-1.5 text-rose-600 hover:bg-rose-500/10" aria-label="Delete document">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={() => setRemoving(null)}
        title="Delete document?"
        description={`${removing?.name || 'This document'} will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        onConfirm={remove}
      />
    </div>
  );
}

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi(`/admin/students/${id}`);
  const [tab, setTab] = useState('overview');
  const [enrolling, setEnrolling] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState(null);
  const [paying, setPaying] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  if (loading && !data) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (error) return <FormBanner tone="error" title="Could not load student">{error}</FormBanner>;
  if (!data) return null;
  const { student, enrollments, payments, totals } = data;
  const age = ageFromDob(student.dob);

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/students/${student.id}`);
      toast.success('Student deleted');
      navigate('/students');
    } catch (err) {
      toast.error(apiError(err));
      setBusy(false);
      setDeleting(false);
    }
  };

  const changeStatus = async (status) => {
    setStatusSaving(true);
    try {
      await api.patch(`/admin/students/${student.id}`, { status });
      toast.success(`Marked ${labelize(status).toLowerCase()}`);
      reload();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setStatusSaving(false);
    }
  };

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'courses', label: 'Courses & fees', count: enrollments.length },
    { value: 'payments', label: 'Payments', count: payments.length },
    { value: 'documents', label: 'Documents', count: student.documents?.length || 0 },
  ];

  return (
    <div className="space-y-3">
      <PageHeader
        back={{ to: '/students', label: 'Students' }}
        title={student.name}
        description={`${student.studentId} · admitted ${formatDate(student.admissionDate)}${student.source !== 'office' ? ` · via ${labelize(student.source)}` : ''}`}
        actions={
          <>
            <Button size="sm" onClick={() => setPaying({})}><IndianRupee className="h-4 w-4" />Collect fee</Button>
            <Button size="sm" variant="outline" onClick={() => setEnrolling(true)}><BookPlus className="h-4 w-4" />Enroll</Button>
            <Button size="sm" variant="outline" onClick={() => navigate(`/students/${student.id}/admission-form`)}><Printer className="h-4 w-4" />Admission form</Button>
            <Button size="sm" variant="outline" onClick={() => navigate(`/students/${student.id}/edit`)}><Pencil className="h-4 w-4" />Edit</Button>
            <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDeleting(true)} aria-label="Delete student"><Trash2 className="h-4 w-4" /></Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <KpiCard label="Net fee" value={formatINR(totals.netFee)} icon={Receipt} tone="slate" />
        <KpiCard label="Paid" value={formatINR(totals.totalPaid)} icon={IndianRupee} tone="sky" />
        <KpiCard label="Balance" value={formatINR(totals.balance)} icon={IndianRupee} tone={totals.balance > 0 ? 'amber' : 'slate'} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="h-fit lg:col-span-1">
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <Avatar src={mediaUrl(student.photo)} alt={student.name} fallback={initials(student.name)} className="h-16 w-16 text-lg" />
              <div className="min-w-0">
                <p className="font-semibold">{student.name}</p>
                <p className="text-xs text-muted-foreground">{student.studentId}{age !== null ? ` · ${age} yrs` : ''}{student.gender ? ` · ${labelize(student.gender)}` : ''}</p>
                <a href={`tel:${student.phone}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <Phone className="h-3.5 w-3.5" />{student.phone}
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={() => window.open(`tel:${student.phone}`)}><Phone className="h-4 w-4" />Call</Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(whatsappLink(student.phone, `Namaste ${student.name}, ${BUSINESSES.institute.name} se message hai.`), '_blank', 'noopener')}
              >
                <MessageCircle className="h-4 w-4" />WhatsApp
              </Button>
            </div>
            <Field label="Student status" hint="Dropped / on-hold students are left out of fee dues.">
              <Select value={student.status} onChange={(e) => changeStatus(e.target.value)} disabled={statusSaving}>
                {STUDENT_STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
              </Select>
            </Field>
            <InfoGrid className="sm:grid-cols-2">
              <Info label="Father" value={student.fatherName} />
              <Info label="Guardian mobile" value={student.parentMobile} />
              <Info label="Course" value={student.courseId?.courseName} />
              <Info label="City" value={student.city} />
            </InfoGrid>
            {student.inquiryId && (
              <Link to={`/admissions/inquiries/${student.inquiryId.id}`} className="block text-xs text-blue-600 hover:underline">
                Converted from inquiry {student.inquiryId.inquiryNumber} →
              </Link>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3 lg:col-span-2">
          <PillTabs tabs={tabs} value={tab} onChange={setTab} />

          {tab === 'overview' && (
            <Card>
              <CardContent className="space-y-5 pt-4">
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Personal</h3>
                  <InfoGrid>
                    <Info label="Full name" value={student.name} />
                    <Info label="Gender" value={student.gender && labelize(student.gender)} />
                    <Info label="Date of birth" value={student.dob && `${formatDate(student.dob)}${age !== null ? ` (${age} yrs)` : ''}`} />
                    <Info label="Mobile" value={student.phone} />
                    <Info label="Email" value={student.email} />
                    <Info label="ID number" value={student.idNumber} />
                  </InfoGrid>
                </section>
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Family & contact</h3>
                  <InfoGrid>
                    <Info label="Father's name" value={student.fatherName} />
                    <Info label="Mother's name" value={student.motherName} />
                    <Info label="Guardian" value={student.parentName && `${student.parentName}${student.guardianRelation ? ` (${student.guardianRelation})` : ''}`} />
                    <Info label="Guardian mobile" value={student.parentMobile} />
                    <Info label="City" value={student.city} />
                    <Info label="Address" value={student.address} className="col-span-2 sm:col-span-3" />
                  </InfoGrid>
                </section>
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Education & background</h3>
                  <InfoGrid>
                    <Info label="Qualification" value={student.qualification} />
                    <Info label="School / College" value={student.schoolName} />
                    <Info label="Computer at home" value={yesNo(student.computerAtHome)} />
                    <Info label="Learned a course before" value={yesNo(student.previousCourse)} />
                  </InfoGrid>
                </section>
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admission</h3>
                  <InfoGrid>
                    <Info label="Student ID" value={student.studentId} />
                    <Info label="Admission date" value={formatDate(student.admissionDate)} />
                    <Info label="Source" value={labelize(student.source)} />
                    <Info label="Status"><StatusBadge status={student.status} /></Info>
                    <Info label="Record created" value={formatDateTime(student.createdAt)} />
                    <Info label="Remarks" value={student.remarks} className="col-span-2 sm:col-span-3" />
                  </InfoGrid>
                </section>
              </CardContent>
            </Card>
          )}

          {tab === 'courses' && (
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Enrollments</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setEnrolling(true)}><BookPlus className="h-4 w-4" />Add</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {enrollments.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <p className="text-sm text-muted-foreground">Not enrolled in any course yet.</p>
                    <Button size="sm" className="mt-3" onClick={() => setEnrolling(true)}>Enroll now</Button>
                  </div>
                ) : (
                  enrollments.map((row) => (
                    <EnrollmentCard key={row.id} row={row} onEdit={() => setEditingEnrollment(row)} onPay={() => setPaying({ feeId: row.fee.id })} />
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {tab === 'payments' && (
            <Card>
              <CardContent className="pt-4">
                {payments.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No payments yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>For</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell><Link to={`/finance/payments/${p.id}`} className="font-medium text-blue-600 hover:underline">{p.receiptNumber}</Link></TableCell>
                          <TableCell className="whitespace-nowrap">{formatDate(p.paymentDate)}</TableCell>
                          <TableCell>{labelize(p.paymentFor)}{p.installmentNumber ? ` #${p.installmentNumber}` : ''}</TableCell>
                          <TableCell>{paymentModeLabel(p.paymentMode)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatINR(p.amount + (p.lateFee || 0))}</TableCell>
                          <TableCell><StatusBadge status={p.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {tab === 'documents' && (
            <Card>
              <CardContent className="pt-4">
                <DocumentsPanel student={student} onChanged={reload} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <EnrollModal open={enrolling} onOpenChange={setEnrolling} student={student} defaultCourseId={enrollments.length ? undefined : student.courseId?.id} onSaved={reload} />
      <EditEnrollmentModal enrollment={editingEnrollment} onOpenChange={() => setEditingEnrollment(null)} onSaved={reload} />
      <PaymentModal
        open={Boolean(paying)}
        onOpenChange={() => setPaying(null)}
        student={student}
        feeId={paying?.feeId}
        onSaved={(payment) => {
          reload();
          navigate(`/finance/payments/${payment.id}`);
        }}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete student?"
        description="Enrollments and fee structures will also be removed. Students with payments cannot be deleted — mark them dropped instead."
        confirmLabel="Delete"
        destructive
        loading={busy}
        onConfirm={remove}
      />
    </div>
  );
}
