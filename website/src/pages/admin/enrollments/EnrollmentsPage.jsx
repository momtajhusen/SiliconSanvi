import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { BookOpenCheck, CheckCircle2, Eye, Hourglass, Pencil, PlayCircle, Plus, Search, Trash2, UserRound, UserX } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Pagination, { useClientPage } from '../../../components/ui/Pagination';
import KpiCard from '../../../components/ui/KpiCard';
import PageHeader from '../../../components/admin/PageHeader';
import StatusBadge from '../../../components/admin/StatusBadge';
import DataState from '../../../components/admin/DataState';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import RowActions from '../../../components/admin/RowActions';
import EnrollModal from '../../../components/admin/EnrollModal';
import EditEnrollmentModal from '../../../components/admin/EditEnrollmentModal';
import { ENROLLMENT_STATUSES } from '../../../constants/institute';
import { formatDate, formatINR, labelize } from '../../../lib/format';
import { useApi, useDebounced } from '../../../hooks/useApi';
import { useCourseOptions, useOpenBatches } from '../../../hooks/useAcademics';
import api, { apiError } from '../../../lib/api';

export default function EnrollmentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courses = useCourseOptions({ includeInactive: true });
  const { batches } = useOpenBatches();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(() => searchParams.get('status') || '');
  const [courseId, setCourseId] = useState(() => searchParams.get('courseId') || '');
  const [batchId, setBatchId] = useState('');
  const q = useDebounced(query.trim());
  const { data, loading, error, reload } = useApi('/admin/enrollments', { q, status, courseId, batchId });
  const page = useClientPage(data?.items);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const counts = data?.counts;
  const batchOptions = batches.filter((b) => !courseId || (b.courseId?.id || b.courseId) === courseId);

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/enrollments/${deleting.id}`);
      toast.success('Enrollment deleted');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="Enrollments"
        description="Which student is in which course and batch, with progress and fee status."
        actions={<Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />New enrollment</Button>}
      />

      {counts && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard label="Total enrollments" value={Object.values(counts).reduce((a, b) => a + b, 0)} icon={BookOpenCheck} tone="slate" onClick={() => setStatus('')} />
          <KpiCard label="Enrolled" value={counts.enrolled} icon={Hourglass} tone="amber" onClick={() => setStatus('enrolled')} />
          <KpiCard label="In progress" value={counts.in_progress} icon={PlayCircle} tone="sky" onClick={() => setStatus('in_progress')} />
          <KpiCard label="Completed" value={counts.completed} icon={CheckCircle2} tone="violet" onClick={() => setStatus('completed')} />
          <KpiCard label="Dropped / suspended" value={counts.dropped + counts.suspended} icon={UserX} tone="rose" className="col-span-2 sm:col-span-1" onClick={() => setStatus('dropped')} />
        </div>
      )}

      <Card>
        <CardContent className="space-y-3 pt-3">
          <div className="flex flex-col gap-2 lg:flex-row">
            <Input placeholder="Search student or ENR no…" iconLeft={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} className="lg:max-w-xs" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex">
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="lg:w-36">
                <option value="">All status</option>
                {ENROLLMENT_STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
              </Select>
              <Select value={courseId} onChange={(e) => { setCourseId(e.target.value); setBatchId(''); }} className="lg:w-52">
                <option value="">All courses</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.courseName}</option>)}
              </Select>
              <Select value={batchId} onChange={(e) => setBatchId(e.target.value)} className="col-span-2 sm:col-span-1 lg:w-48">
                <option value="">All batches</option>
                <option value="none">No batch assigned</option>
                {batchOptions.map((b) => <option key={b.id} value={b.id}>{b.batchName}</option>)}
              </Select>
            </div>
          </div>

          <DataState loading={loading && !data} error={error} onRetry={reload} empty={!page.total} emptyTitle="No enrollments found">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Course / Batch</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">
                      <Link to={`/enrollments/${row.id}`} className="font-medium hover:underline">{row.enrollmentNumber}</Link>
                      <p className="text-xs text-muted-foreground">{formatDate(row.enrollmentDate)}</p>
                    </TableCell>
                    <TableCell className="max-w-[12rem]">
                      <Link to={`/students/${row.studentId?.id}`} className="font-medium hover:underline">{row.studentId?.name}</Link>
                      <p className="text-xs text-muted-foreground">{row.studentId?.studentId}</p>
                    </TableCell>
                    <TableCell className="max-w-[14rem]">
                      <p>{row.courseId?.courseName}</p>
                      <p className={`text-xs ${row.batchId ? 'text-muted-foreground' : 'font-medium text-amber-600'}`}>{row.batchId?.batchName || 'No batch'}</p>
                    </TableCell>
                    <TableCell className="min-w-[6rem]">
                      <p className="text-xs font-medium">
                        {row.progressPercentage || 0}%
                        {['enrolled', 'in_progress'].includes(row.status) && row.expectedCompletionDate && new Date(row.expectedCompletionDate) < new Date() && (
                          <span className="ml-1 text-rose-600">· overdue</span>
                        )}
                      </p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--color-muted))]">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${row.progressPercentage || 0}%` }} />
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {row.fee ? (
                        <Link to={`/finance/fees/${row.fee.id}`} className="hover:underline">
                          <p className="font-medium">{formatINR(row.fee.totalPaid)} <span className="text-muted-foreground">/ {formatINR(row.fee.netFee)}</span></p>
                          <StatusBadge status={row.fee.feeStatus} className="mt-0.5" />
                        </Link>
                      ) : '—'}
                    </TableCell>
                    <TableCell><StatusBadge status={row.status} /></TableCell>
                    <TableCell>
                      <RowActions
                        actions={[
                          { icon: Eye, label: 'View details', onClick: () => navigate(`/enrollments/${row.id}`) },
                          { icon: UserRound, label: 'Student profile', onClick: () => navigate(`/students/${row.studentId?.id}`) },
                          { icon: Pencil, label: 'Update', onClick: () => setEditing(row) },
                          { icon: Trash2, label: 'Delete', tone: 'danger', onClick: () => setDeleting(row) },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page.page} total={page.total} limit={page.limit} onPage={page.setPage} />
          </DataState>
        </CardContent>
      </Card>

      <EnrollModal open={creating} onOpenChange={setCreating} onSaved={reload} />
      <EditEnrollmentModal enrollment={editing} onOpenChange={() => setEditing(null)} onSaved={reload} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={() => setDeleting(null)}
        title="Delete enrollment?"
        description={deleting ? `${deleting.enrollmentNumber} and its fee structure will be removed. Enrollments with payments cannot be deleted — mark them dropped instead.` : ''}
        confirmLabel="Delete"
        destructive
        loading={busy}
        onConfirm={remove}
      />
    </div>
  );
}
