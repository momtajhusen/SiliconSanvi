import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CalendarCheck, CheckCircle2, Clock, IndianRupee, Pencil, Trash2, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import KpiCard from '../../../components/ui/KpiCard';
import { Skeleton } from '../../../components/ui/Loader';
import { FormBanner } from '../../../components/ui/FormBanner';
import PageHeader from '../../../components/admin/PageHeader';
import StatusBadge from '../../../components/admin/StatusBadge';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import Info, { InfoGrid } from '../../../components/admin/Info';
import EditEnrollmentModal from '../../../components/admin/EditEnrollmentModal';
import PaymentModal from '../../../components/admin/PaymentModal';
import {
  daysBetween, formatDate, formatINR, formatSpan, formatTiming, initials, labelize,
} from '../../../lib/format';
import { cn } from '../../../lib/utils';
import { useApi } from '../../../hooks/useApi';
import api, { apiError, mediaUrl } from '../../../lib/api';
import { paymentModeLabel } from '../../../constants/institute';

const ACTIVE = ['enrolled', 'in_progress'];

function Timeline({ enrollment }) {
  const start = enrollment.enrollmentDate;
  const expected = enrollment.expectedCompletionDate;
  const actual = enrollment.actualCompletionDate;
  const active = ACTIVE.includes(enrollment.status);
  const elapsed = daysBetween(start, actual || new Date());
  const planned = expected ? daysBetween(start, expected) : null;
  const left = expected && active ? daysBetween(new Date(), expected) : null;
  const timePct = planned > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / planned) * 100))) : 0;
  const progress = enrollment.progressPercentage || 0;
  const behind = active && planned > 0 && progress + 10 < timePct;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Info label="Enrolled on" value={formatDate(start)} />
        <Info label={actual ? 'Took' : 'Time since enrollment'} value={formatSpan(elapsed)} />
        <Info label="Expected completion" value={expected ? `${formatDate(expected)}${planned !== null ? ` (${formatSpan(planned)})` : ''}` : '—'} />
        {actual ? (
          <Info label="Completed on">
            <span>
              {formatDate(actual)}
              {expected && (
                <span className={cn('ml-1 text-xs', daysBetween(expected, actual) > 0 ? 'text-rose-600' : 'text-blue-600')}>
                  {daysBetween(expected, actual) > 0 ? `${formatSpan(daysBetween(expected, actual))} late` : 'on time'}
                </span>
              )}
            </span>
          </Info>
        ) : (
          <Info label={left !== null && left < 0 ? 'Overdue by' : 'Days left'}>
            {left === null ? '—' : (
              <span className={cn('font-semibold', left < 0 ? 'text-rose-600' : left <= 7 ? 'text-amber-600' : '')}>
                {left < 0 ? formatSpan(-left) : left === 0 ? 'Due today' : formatSpan(left)}
              </span>
            )}
          </Info>
        )}
      </div>

      <div className="space-y-2">
        <div>
          <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">Course progress</span><span className="font-semibold">{progress}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--color-muted))]"><div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} /></div>
        </div>
        {planned > 0 && (
          <div>
            <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">Time used</span><span className="font-semibold">{timePct}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--color-muted))]"><div className={cn('h-full rounded-full', timePct >= 100 && active ? 'bg-rose-500' : 'bg-slate-400')} style={{ width: `${timePct}%` }} /></div>
          </div>
        )}
        {behind && <p className="text-xs font-medium text-amber-600">Progress is behind schedule ({progress}% done, {timePct}% of the time used).</p>}
      </div>
    </div>
  );
}

export default function EnrollmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi(`/admin/enrollments/${id}`);
  const [editing, setEditing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading && !data) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-72 w-full" /></div>;
  if (error) return <FormBanner tone="error" title="Could not load enrollment">{error}</FormBanner>;
  if (!data) return null;
  const { enrollment, fee, payments } = data;
  const student = enrollment.studentId;
  const course = enrollment.courseId;
  const batch = enrollment.batchId;
  const active = ACTIVE.includes(enrollment.status);

  const run = async () => {
    setBusy(true);
    try {
      if (confirm === 'delete') {
        await api.delete(`/admin/enrollments/${enrollment.id}`);
        toast.success('Enrollment deleted');
        navigate('/enrollments');
        return;
      }
      await api.patch(`/admin/enrollments/${enrollment.id}`, { status: confirm });
      toast.success(confirm === 'completed' ? 'Marked completed' : 'Marked dropped');
      setConfirm(null);
      reload();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const CONFIRM = {
    completed: { title: 'Mark course completed?', description: 'Progress becomes 100% and today is saved as the completion date.', label: 'Mark completed' },
    dropped: { title: 'Mark as dropped?', description: 'The student left this course. Their pending fee will stop showing in dues.', label: 'Mark dropped', destructive: true },
    delete: { title: 'Delete enrollment?', description: 'The enrollment and its fee structure will be removed. Enrollments with payments cannot be deleted.', label: 'Delete', destructive: true },
  }[confirm];

  return (
    <div className="space-y-3">
      <PageHeader
        back={{ to: '/enrollments', label: 'Enrollments' }}
        title={`${course?.courseName || 'Enrollment'}`}
        description={`${enrollment.enrollmentNumber} · ${student?.name} (${student?.studentId})`}
        actions={
          <>
            {fee?.balance > 0 && <Button size="sm" onClick={() => setPaying(true)}><IndianRupee className="h-4 w-4" />Collect fee</Button>}
            {active && <Button size="sm" variant="outline" onClick={() => setConfirm('completed')}><CheckCircle2 className="h-4 w-4" />Complete</Button>}
            {active && <Button size="sm" variant="outline" onClick={() => setConfirm('dropped')}><UserX className="h-4 w-4" />Drop</Button>}
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Update</Button>
            <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setConfirm('delete')} aria-label="Delete enrollment"><Trash2 className="h-4 w-4" /></Button>
          </>
        }
      />

      {fee && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <KpiCard label="Net fee" value={formatINR(fee.netFee)} icon={IndianRupee} tone="slate" />
          <KpiCard label="Paid" value={formatINR(fee.totalPaid)} icon={IndianRupee} tone="sky" />
          <KpiCard label="Balance" value={formatINR(fee.balance)} icon={IndianRupee} tone={fee.balance > 0 ? 'amber' : 'slate'} />
          <KpiCard
            label={fee.overdueAmount > 0 ? 'Overdue' : 'Next due'}
            value={fee.overdueAmount > 0 ? formatINR(fee.overdueAmount) : fee.nextDueDate ? `${formatINR(fee.nextDueAmount)} · ${formatDate(fee.nextDueDate)}` : '—'}
            icon={fee.overdueAmount > 0 ? Clock : CalendarCheck}
            tone={fee.overdueAmount > 0 ? 'rose' : 'violet'}
          />
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-3">
          <Card>
            <CardContent className="space-y-3 pt-4">
              <Link to={`/students/${student?.id}`} className="flex items-center gap-3 rounded-lg hover:bg-[hsl(var(--color-muted))]/40">
                <Avatar src={mediaUrl(student?.photo)} alt={student?.name} fallback={initials(student?.name)} className="h-12 w-12" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{student?.name}</p>
                  <p className="text-xs text-muted-foreground">{student?.studentId} · {student?.phone}</p>
                </div>
                <StatusBadge status={student?.status} className="ml-auto" />
              </Link>
              <InfoGrid className="sm:grid-cols-2">
                <Info label="Father" value={student?.fatherName} />
                <Info label="Email" value={student?.email} />
              </InfoGrid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Course & batch</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {course?.image && <img src={mediaUrl(course.image)} alt={course.courseName} className="h-28 w-full rounded-lg object-cover" />}
              <InfoGrid className="sm:grid-cols-2">
                <Info label="Course">
                  <Link to={`/academics/courses/${course?.id}`} className="text-blue-600 hover:underline">{course?.courseName}</Link>
                </Info>
                <Info label="Code / type" value={`${course?.courseCode || ''}${course?.courseType ? ` · ${labelize(course.courseType)}` : ''}`} />
                <Info label="Duration" value={course?.durationMonths ? `${course.durationMonths} months` : ''} />
                <Info label="Course fee" value={course && formatINR(course.baseFee)} />
                {batch ? (
                  <>
                    <Info label="Batch" value={`${batch.batchName} (${batch.batchCode})`} />
                    <Info label="Timing" value={formatTiming(batch.timingFrom, batch.timingTo)} />
                    <Info label="Days" value={batch.days?.length ? batch.days.join(', ') : ''} />
                    <Info label="Faculty / room" value={[batch.faculty, batch.room].filter(Boolean).join(' · ')} />
                    <Info label="Batch dates" value={`${formatDate(batch.startDate)} – ${batch.endDate ? formatDate(batch.endDate) : 'open'}`} className="col-span-2" />
                  </>
                ) : (
                  <Info label="Batch" className="col-span-2"><span className="font-medium text-amber-600">No batch assigned</span></Info>
                )}
              </InfoGrid>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Timeline</CardTitle>
              <StatusBadge status={enrollment.status} />
            </CardHeader>
            <CardContent className="space-y-3">
              <Timeline enrollment={enrollment} />
              {enrollment.remarks && <Info label="Remarks" value={enrollment.remarks} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Fee & installments</CardTitle>
              {fee && <Link to={`/finance/fees/${fee.id}`} className="text-xs font-medium text-blue-600 hover:underline">Edit fee structure</Link>}
            </CardHeader>
            <CardContent className="space-y-3">
              {!fee ? (
                <p className="text-sm text-muted-foreground">No fee structure for this enrollment.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <Info label="Course fee" value={formatINR(fee.courseFee)} />
                    <Info label="Admission + other" value={formatINR((fee.admissionFee || 0) + (fee.examFee || 0) + (fee.certificateFee || 0) + (fee.otherFees || 0))} />
                    <Info label="Discount + scholarship" value={formatINR((fee.discount || 0) + (fee.scholarship || 0))} />
                    <Info label="Fee status"><StatusBadge status={fee.feeStatus} /></Info>
                  </div>
                  {fee.installmentProgress?.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Due date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead className="text-right">Remaining</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fee.installmentProgress.map((inst) => (
                          <TableRow key={inst.number}>
                            <TableCell>{inst.title || `Installment ${inst.number}`}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatDate(inst.dueDate)}</TableCell>
                            <TableCell className="text-right">{formatINR(inst.amount)}</TableCell>
                            <TableCell className="text-right">{formatINR(inst.paidAmount)}</TableCell>
                            <TableCell className={cn('text-right font-medium', inst.remaining > 0 && 'text-amber-600')}>{formatINR(inst.remaining)}</TableCell>
                            <TableCell><StatusBadge status={inst.status} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No payments for this course yet.</p>
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
        </div>
      </div>

      <EditEnrollmentModal enrollment={editing ? enrollment : null} onOpenChange={() => setEditing(false)} onSaved={reload} />
      <PaymentModal
        open={paying}
        onOpenChange={() => setPaying(false)}
        student={student}
        feeId={fee?.id}
        onSaved={(payment) => navigate(`/finance/payments/${payment.id}`)}
      />
      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={() => setConfirm(null)}
        title={CONFIRM?.title}
        description={CONFIRM?.description}
        confirmLabel={CONFIRM?.label}
        destructive={CONFIRM?.destructive}
        loading={busy}
        onConfirm={run}
      />
    </div>
  );
}
