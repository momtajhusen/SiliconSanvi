import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CalendarClock, CheckCircle2, Eye, Layers, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';
import KpiCard from '../../../components/ui/KpiCard';
import { FormBanner } from '../../../components/ui/FormBanner';
import { Skeleton } from '../../../components/ui/Loader';
import PageHeader from '../../../components/admin/PageHeader';
import StatusBadge from '../../../components/admin/StatusBadge';
import DataState from '../../../components/admin/DataState';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import RowActions from '../../../components/admin/RowActions';
import Field from '../../../components/admin/Field';
import { BATCH_STATUSES, BATCH_TYPES, WEEK_DAYS } from '../../../constants/institute';
import { formatDate, formatINR, formatTiming, labelize, toInputDate, todayInput } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import { useApi, useDebounced } from '../../../hooks/useApi';
import { useCourseOptions } from '../../../hooks/useAcademics';
import api, { apiError } from '../../../lib/api';

const EMPTY = {
  batchName: '', courseId: '', startDate: todayInput(), endDate: '', timingFrom: '09:00', timingTo: '10:30',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], room: '', faculty: '', maxStrength: 20, batchType: 'regular', status: 'upcoming',
};

function BatchForm({ batch, courses, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
    batch
      ? { ...EMPTY, ...batch, courseId: batch.courseId?.id || batch.courseId, startDate: toInputDate(batch.startDate), endDate: toInputDate(batch.endDate) }
      : EMPTY
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const toggleDay = (day) =>
    setForm((prev) => ({ ...prev, days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day] }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.batchName.trim() || !form.courseId) return setError('Batch name and course are required');
    if (!form.startDate) return setError('Select a start date');
    if (form.timingFrom >= form.timingTo) return setError('End time must be after start time');
    setError('');
    setSaving(true);
    const body = {
      batchName: form.batchName, courseId: form.courseId, startDate: form.startDate, endDate: form.endDate || null,
      timingFrom: form.timingFrom, timingTo: form.timingTo, days: form.days, room: form.room, faculty: form.faculty,
      maxStrength: Number(form.maxStrength) || 20, batchType: form.batchType, status: form.status,
    };
    try {
      if (batch) await api.patch(`/admin/batches/${batch.id}`, body);
      else await api.post('/admin/batches', body);
      toast.success(batch ? 'Batch updated' : 'Batch created');
      onSaved();
      onClose();
    } catch (err) {
      setError(apiError(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <FormBanner tone="error" title="Could not save">{error}</FormBanner>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Batch name" required><Input value={form.batchName} onChange={set('batchName')} placeholder="e.g. Tally · Morning" /></Field>
        <Field label="Course" required>
          <Select value={form.courseId} onChange={set('courseId')}>
            <option value="">Select course</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.courseName} ({c.courseCode})</option>)}
          </Select>
        </Field>
        <Field label="Start date" required><Input type="date" value={form.startDate} onChange={set('startDate')} /></Field>
        <Field label="End date"><Input type="date" value={form.endDate} onChange={set('endDate')} /></Field>
        <Field label="From" required><Input type="time" value={form.timingFrom} onChange={set('timingFrom')} /></Field>
        <Field label="To" required><Input type="time" value={form.timingTo} onChange={set('timingTo')} /></Field>
      </div>
      <Field label="Days">
        <div className="flex flex-wrap gap-1.5">
          {WEEK_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                form.days.includes(day)
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-[hsl(var(--color-border-premium))] text-muted-foreground hover:bg-[hsl(var(--color-muted))]'
              )}
            >
              {day}
            </button>
          ))}
        </div>
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Faculty"><Input value={form.faculty || ''} onChange={set('faculty')} /></Field>
        <Field label="Room / Lab"><Input value={form.room || ''} onChange={set('room')} /></Field>
        <Field label="Max students"><Input type="number" min="1" value={form.maxStrength} onChange={set('maxStrength')} /></Field>
        <Field label="Type">
          <Select value={form.batchType} onChange={set('batchType')}>
            {BATCH_TYPES.map((t) => <option key={t} value={t}>{labelize(t)}</option>)}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={set('status')}>
            {BATCH_STATUSES.map((t) => <option key={t} value={t}>{labelize(t)}</option>)}
          </Select>
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" size="sm" loading={saving}>{batch ? 'Save changes' : 'Create batch'}</Button>
      </div>
    </form>
  );
}

function ProgressPair({ actual, expected }) {
  if (actual === null && expected === null) return <span className="text-xs text-muted-foreground">—</span>;
  const behind = actual !== null && expected !== null && actual + 10 < expected;
  return (
    <div className="min-w-[7rem] space-y-1">
      <p className="text-xs">
        <span className="font-semibold">{actual ?? 0}%</span>
        {expected !== null && <span className="text-muted-foreground"> / {expected}% expected</span>}
      </p>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-[hsl(var(--color-muted))]">
        <div className={cn('h-full rounded-full', behind ? 'bg-amber-500' : 'bg-blue-600')} style={{ width: `${actual ?? 0}%` }} />
        {expected !== null && <span className="absolute top-0 h-full w-0.5 bg-slate-500" style={{ left: `calc(${expected}% - 1px)` }} />}
      </div>
    </div>
  );
}

function BatchDetail({ batchId, onChanged }) {
  const { data, loading, error, reload } = useApi(`/admin/batches/${batchId}`);
  const [completing, setCompleting] = useState(false);
  const [busy, setBusy] = useState(false);
  if (loading && !data) return <Skeleton className="h-40 w-full" />;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  const { batch, enrollments } = data;
  const running = enrollments.filter((row) => ['enrolled', 'in_progress'].includes(row.status));
  const balance = enrollments.reduce((sum, row) => sum + (row.fee?.balance || 0), 0);

  const complete = async () => {
    setBusy(true);
    try {
      const { data: res } = await api.post(`/admin/batches/${batch.id}/complete`);
      toast.success(`Batch completed · ${res.completedStudents} student${res.completedStudents === 1 ? '' : 's'} marked completed`);
      setCompleting(false);
      reload();
      onChanged?.();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
        <div><p className="text-xs text-muted-foreground">Timing</p><p className="font-medium">{formatTiming(batch.timingFrom, batch.timingTo)}</p></div>
        <div><p className="text-xs text-muted-foreground">Days</p><p className="font-medium">{batch.days?.join(', ') || '—'}</p></div>
        <div><p className="text-xs text-muted-foreground">Strength</p><p className="font-medium">{batch.currentStrength}/{batch.maxStrength} · {batch.seatsLeft} left</p></div>
        <div><p className="text-xs text-muted-foreground">Faculty / room</p><p className="font-medium">{[batch.faculty, batch.room].filter(Boolean).join(' · ') || '—'}</p></div>
        <div><p className="text-xs text-muted-foreground">Started</p><p className="font-medium">{formatDate(batch.startDate)}</p></div>
        <div><p className="text-xs text-muted-foreground">{batch.endDate ? 'Ends' : 'Planned end'}</p><p className="font-medium">{batch.plannedEndDate ? formatDate(batch.plannedEndDate) : '—'}</p></div>
        <div className="col-span-2"><p className="text-xs text-muted-foreground">Class progress</p><ProgressPair actual={batch.avgProgress} expected={batch.expectedProgress} /></div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[hsl(var(--color-muted))]/40 px-3 py-2 text-sm">
        <span>
          <StatusBadge status={batch.status} /> <span className="ml-1">{running.length} running · fee balance <b className={balance > 0 ? 'text-amber-600' : ''}>{formatINR(balance)}</b></span>
        </span>
        {!['completed', 'cancelled'].includes(batch.status) && (
          <Button size="sm" variant="outline" onClick={() => setCompleting(true)}><CheckCircle2 className="h-4 w-4" />Mark batch complete</Button>
        )}
      </div>

      {enrollments.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">No students in this batch yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="text-right">Fee balance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link to={`/enrollments/${row.id}`} className="font-medium hover:underline">{row.studentId?.name}</Link>
                  <p className="text-xs text-muted-foreground">{row.studentId?.studentId} · {row.studentId?.phone}</p>
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(row.enrollmentDate)}</TableCell>
                <TableCell>{row.progressPercentage || 0}%</TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  {row.fee ? (
                    <Link to={`/finance/fees/${row.fee.id}`} className={cn('hover:underline', row.fee.balance > 0 ? 'font-semibold text-amber-600' : 'text-muted-foreground')}>
                      {formatINR(row.fee.balance)}
                    </Link>
                  ) : '—'}
                </TableCell>
                <TableCell><StatusBadge status={row.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={completing}
        onOpenChange={setCompleting}
        title="Mark batch complete?"
        description={`${running.length} running student${running.length === 1 ? '' : 's'} will be marked completed (100%, completed today) and the batch will close.`}
        confirmLabel="Complete batch"
        loading={busy}
        onConfirm={complete}
      />
    </div>
  );
}

export default function BatchesPage() {
  const courses = useCourseOptions({ includeInactive: true });
  const [query, setQuery] = useState('');
  const [courseId, setCourseId] = useState('');
  const [status, setStatus] = useState('upcoming,active');
  const q = useDebounced(query.trim());
  const { data, loading, error, reload } = useApi('/admin/batches', { courseId, status, q });
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const rows = data?.items || [];
  const summary = data?.summary;

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/batches/${deleting.id}`);
      toast.success('Batch deleted');
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
        title="Batches"
        description="Class timings, faculty and seats for each course."
        actions={<Button size="sm" onClick={() => setEditing('new')}><Plus className="h-4 w-4" />New batch</Button>}
      />

      {summary && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard label="Total batches" value={summary.total} icon={Layers} tone="slate" onClick={() => setStatus('')} />
          <KpiCard label="Active" value={summary.counts.active} icon={Users} tone="sky" onClick={() => setStatus('active')} />
          <KpiCard label="Upcoming" value={summary.counts.upcoming} icon={CalendarClock} tone="amber" onClick={() => setStatus('upcoming')} />
          <KpiCard label="Completed" value={summary.counts.completed} icon={CheckCircle2} tone="violet" onClick={() => setStatus('completed')} />
          <KpiCard label="Students in batches" value={summary.studentsInBatches} icon={Users} tone="sky" className="col-span-2 sm:col-span-1" />
        </div>
      )}

      <Card>
        <CardContent className="space-y-3 pt-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input placeholder="Search batch or faculty…" iconLeft={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} className="sm:max-w-xs" />
            <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="sm:w-56">
              <option value="">All courses</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.courseName}</option>)}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-44">
              <option value="upcoming,active">Open batches</option>
              <option value="">All status</option>
              {BATCH_STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
            </Select>
          </div>

          <DataState
            loading={loading && !data}
            error={error}
            onRetry={reload}
            empty={!rows.length}
            emptyTitle="No batches found"
            emptyAction={<Button size="sm" variant="outline" onClick={() => setEditing('new')}>Create a batch</Button>}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Timing</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((batch) => {
                  const fill = Math.min(100, Math.round((batch.currentStrength / Math.max(1, batch.maxStrength)) * 100));
                  return (
                    <TableRow key={batch.id} className="cursor-pointer" onClick={() => setViewing(batch)}>
                      <TableCell className="max-w-[14rem]">
                        <p className="font-medium">{batch.batchName}</p>
                        <p className="text-xs text-muted-foreground">{batch.batchCode}{batch.faculty ? ` · ${batch.faculty}` : ''}</p>
                      </TableCell>
                      <TableCell className="max-w-[12rem]">{batch.courseId?.courseName || '—'}</TableCell>
                      <TableCell>
                        <p className="whitespace-nowrap">{formatTiming(batch.timingFrom, batch.timingTo)}</p>
                        <p className="text-xs text-muted-foreground">{batch.days?.length === 7 ? 'All days' : batch.days?.join(' ')}</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(batch.startDate)}
                        {batch.plannedEndDate && <p className="text-[11px] text-muted-foreground">to {formatDate(batch.plannedEndDate)}</p>}
                      </TableCell>
                      <TableCell className="min-w-[7rem]">
                        <p className="text-xs font-medium">{batch.currentStrength}/{batch.maxStrength}</p>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--color-muted))]">
                          <div className={cn('h-full rounded-full', fill >= 100 ? 'bg-rose-500' : fill >= 80 ? 'bg-amber-500' : 'bg-blue-600')} style={{ width: `${fill}%` }} />
                        </div>
                      </TableCell>
                      <TableCell><ProgressPair actual={batch.avgProgress} expected={batch.expectedProgress} /></TableCell>
                      <TableCell><StatusBadge status={batch.status} /></TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          actions={[
                            { icon: Eye, label: 'View students', onClick: () => setViewing(batch) },
                            { icon: Pencil, label: 'Edit', onClick: () => setEditing(batch) },
                            { icon: Trash2, label: 'Delete', tone: 'danger', onClick: () => setDeleting(batch) },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DataState>
        </CardContent>
      </Card>

      <Modal open={Boolean(editing)} onOpenChange={() => setEditing(null)} title={editing === 'new' ? 'New batch' : 'Edit batch'} className="max-w-2xl">
        {editing && <BatchForm batch={editing === 'new' ? null : editing} courses={courses} onClose={() => setEditing(null)} onSaved={reload} />}
      </Modal>

      <Modal
        open={Boolean(viewing)}
        onOpenChange={() => setViewing(null)}
        title={viewing?.batchName}
        description={viewing ? `${viewing.batchCode} · ${viewing.courseId?.courseName || ''}` : undefined}
        className="max-w-2xl"
      >
        {viewing && <BatchDetail batchId={viewing.id} onChanged={reload} />}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={() => setDeleting(null)}
        title="Delete batch?"
        description={deleting ? `${deleting.batchName} will be removed. Batches with active students cannot be deleted.` : ''}
        confirmLabel="Delete"
        destructive
        loading={busy}
        onConfirm={remove}
      />
    </div>
  );
}
