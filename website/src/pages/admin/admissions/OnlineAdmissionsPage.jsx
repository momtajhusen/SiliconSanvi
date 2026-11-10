import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { BookOpenCheck, Clock, ExternalLink, Globe, GraduationCap, Phone, UserCheck, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import KpiCard from '../../../components/ui/KpiCard';
import PageHeader from '../../../components/admin/PageHeader';
import StatusBadge from '../../../components/admin/StatusBadge';
import DataState from '../../../components/admin/DataState';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import ConvertInquiryModal from '../../../components/admin/ConvertInquiryModal';
import EnrollModal from '../../../components/admin/EnrollModal';
import { formatDate, formatDateTime, labelize } from '../../../lib/format';
import { useApi } from '../../../hooks/useApi';
import api, { apiError } from '../../../lib/api';

export default function OnlineAdmissionsPage() {
  const { data, loading, error, reload } = useApi('/admin/admissions/online');
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [enrolling, setEnrolling] = useState(null);
  const [busy, setBusy] = useState(false);
  const pending = data?.pending || [];
  const awaiting = data?.awaitingEnrollment || [];
  const counts = data?.counts || {};

  const reject = async () => {
    setBusy(true);
    try {
      await api.patch(`/admin/inquiries/${rejecting.id}`, { status: 'closed' });
      toast.success('Application rejected');
      setRejecting(null);
      reload();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const markContacted = async (inquiry) => {
    try {
      await api.patch(`/admin/inquiries/${inquiry.id}`, { status: 'in-process' });
      toast.success('Marked as contacted');
      reload();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="Online admission"
        description="Applications submitted from the website admission form."
        actions={
          <Button size="sm" variant="outline" onClick={() => window.open('/admission', '_blank')}>
            <ExternalLink className="h-4 w-4" />Open form
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <KpiCard label="Pending review" value={counts.pending ?? '—'} icon={Clock} tone="amber" />
        <KpiCard label="Awaiting enrollment" value={counts.awaitingEnrollment ?? '—'} icon={BookOpenCheck} tone="sky" />
        <KpiCard label="Rejected" value={counts.rejected ?? '—'} icon={XCircle} tone="slate" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending applications</CardTitle>
          <CardDescription>Call the applicant, then approve to create the student record (and enroll in the same step).</CardDescription>
        </CardHeader>
        <CardContent>
          <DataState loading={loading && !data} error={error} onRetry={reload} empty={!pending.length} emptyTitle="No pending applications" emptyDescription="New online applications will appear here.">
            <div className="grid gap-3 md:grid-cols-2">
              {pending.map((inq) => (
                <div key={inq.id} className="rounded-xl border border-[hsl(var(--color-border-premium))] bg-[hsl(var(--color-card-bg))] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">{inq.name}</p>
                      <a href={`tel:${inq.phone}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        <Phone className="h-3 w-3" />{inq.phone}
                      </a>
                    </div>
                    <StatusBadge status={inq.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-sm">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{inq.courseId?.courseName || inq.courseInterest || '—'}</span>
                    {inq.preferredBatch && <span className="text-xs text-muted-foreground">· {inq.preferredBatch}</span>}
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <div><dt className="text-muted-foreground">Gender</dt><dd>{labelize(inq.gender)}</dd></div>
                    <div><dt className="text-muted-foreground">Father</dt><dd className="truncate">{inq.fatherName || '—'}</dd></div>
                    <div><dt className="text-muted-foreground">Qualification</dt><dd className="truncate">{inq.qualification || '—'}</dd></div>
                    <div><dt className="text-muted-foreground">DOB</dt><dd>{inq.dob ? formatDate(inq.dob) : '—'}</dd></div>
                  </dl>
                  {inq.remarks && <p className="mt-2 rounded-lg bg-[hsl(var(--color-muted))]/60 px-2 py-1.5 text-xs">{inq.remarks}</p>}
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Globe className="h-3 w-3" />{inq.inquiryNumber} · {formatDateTime(inq.createdAt)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setApproving(inq)}><UserCheck className="h-4 w-4" />Approve</Button>
                    {inq.status === 'new' && <Button size="sm" variant="outline" onClick={() => markContacted(inq)}>Contacted</Button>}
                    <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setRejecting(inq)}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          </DataState>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approved — awaiting enrollment</CardTitle>
          <CardDescription>Students admitted from online applications who are not yet in a course/batch.</CardDescription>
        </CardHeader>
        <CardContent>
          {data && !awaiting.length ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">Everyone approved online is enrolled.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course applied</TableHead>
                  <TableHead>Admitted</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {awaiting.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Link to={`/students/${student.id}`} className="font-medium hover:underline">{student.name}</Link>
                      <p className="text-xs text-muted-foreground">{student.studentId} · {student.phone}</p>
                    </TableCell>
                    <TableCell>{student.courseId?.courseName || '—'}</TableCell>
                    <TableCell>{formatDate(student.admissionDate)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setEnrolling(student)}>Enroll</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConvertInquiryModal inquiry={approving} onOpenChange={() => setApproving(null)} onSaved={reload} />
      <EnrollModal
        open={Boolean(enrolling)}
        onOpenChange={() => setEnrolling(null)}
        student={enrolling}
        defaultCourseId={enrolling?.courseId?.id}
        onSaved={reload}
      />
      <ConfirmDialog
        open={Boolean(rejecting)}
        onOpenChange={() => setRejecting(null)}
        title="Reject application?"
        description={rejecting ? `${rejecting.name}'s application will be closed. You can reopen it from Inquiries.` : ''}
        confirmLabel="Reject"
        destructive
        loading={busy}
        onConfirm={reject}
      />
    </div>
  );
}
