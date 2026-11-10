import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, CalendarClock, CalendarDays, Download, IndianRupee, MessageCircle, Phone, Receipt, Search, Wallet } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import KpiCard from '../../../components/ui/KpiCard';
import Pagination, { useClientPage } from '../../../components/ui/Pagination';
import PageHeader from '../../../components/admin/PageHeader';
import StatusBadge from '../../../components/admin/StatusBadge';
import DataState from '../../../components/admin/DataState';
import PaymentModal from '../../../components/admin/PaymentModal';
import PillTabs from '../../../components/admin/PillTabs';
import { BUSINESSES } from '../../../constants/site';
import { downloadCsv, formatDate, formatINR, whatsappLink } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import { useApi, useDebounced } from '../../../hooks/useApi';
import { useCourseOptions } from '../../../hooks/useAcademics';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'partial', label: 'Partial' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
];

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
        active
          ? 'border-blue-700 bg-blue-700 text-white'
          : 'border-[hsl(var(--color-border-premium))] bg-[hsl(var(--color-card-bg))] text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

function FeeList({ onCollect }) {
  const navigate = useNavigate();
  const courses = useCourseOptions({ includeInactive: true });
  const [status, setStatus] = useState('unpaid');
  const [courseId, setCourseId] = useState('');
  const [query, setQuery] = useState('');
  const q = useDebounced(query.trim());
  const { data, loading, error, reload } = useApi('/admin/fees', { status, courseId, q });
  const page = useClientPage(data?.items);
  const summary = data?.summary;
  const counts = summary?.counts || {};
  const countFor = (value) =>
    value === '' ? Object.values(counts).reduce((a, b) => a + b, 0)
      : value === 'unpaid' ? (counts.pending || 0) + (counts.partial || 0) + (counts.overdue || 0)
        : counts[value] || 0;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label="Total net fee" value={summary ? formatINR(summary.netFee) : '—'} icon={Receipt} tone="slate" />
        <KpiCard label="Collected" value={summary ? formatINR(summary.totalPaid) : '—'} icon={Wallet} tone="sky" />
        <KpiCard label="Balance due" value={summary ? formatINR(summary.balance) : '—'} icon={IndianRupee} tone="amber" />
        <KpiCard label="Overdue" value={summary ? formatINR(summary.overdueAmount) : '—'} icon={AlertTriangle} tone="rose" />
      </div>

      <Card>
        <CardContent className="space-y-3 pt-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {STATUS_TABS.map((t) => (
              <Pill key={t.value} active={status === t.value} onClick={() => setStatus(t.value)}>
                {t.label}
                <span className={cn('rounded-full px-1.5 text-[10px]', status === t.value ? 'bg-white/20' : 'bg-[hsl(var(--color-muted))]')}>{countFor(t.value)}</span>
              </Pill>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input placeholder="Search student…" iconLeft={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} className="sm:max-w-xs" />
            <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="sm:w-56">
              <option value="">All courses</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.courseName}</option>)}
            </Select>
          </div>

          <DataState loading={loading && !data} error={error} onRetry={reload} empty={!page.total} emptyTitle="No fee records" emptyDescription="Fee structures are created automatically when a student is enrolled.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-right">Net fee</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Next due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.rows.map((fee) => (
                  <TableRow key={fee.id} className="cursor-pointer" onClick={() => navigate(`/finance/fees/${fee.id}`)}>
                    <TableCell className="max-w-[12rem]">
                      <p className="font-medium">{fee.studentId?.name}</p>
                      <p className="text-xs text-muted-foreground">{fee.studentId?.studentId} · {fee.studentId?.phone}</p>
                    </TableCell>
                    <TableCell className="max-w-[12rem]">
                      <p>{fee.courseId?.courseName}</p>
                      <p className="text-xs text-muted-foreground">{fee.installments > 1 ? `${fee.installments} installments` : 'One-time'}</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">{formatINR(fee.netFee)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right">{formatINR(fee.totalPaid)}</TableCell>
                    <TableCell className={cn('whitespace-nowrap text-right font-semibold', fee.balance > 0 && 'text-amber-600')}>{formatINR(fee.balance)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {fee.nextDueDate ? (
                        <>
                          <p>{formatDate(fee.nextDueDate)}</p>
                          <p className="text-xs text-muted-foreground">{formatINR(fee.nextDueAmount)}</p>
                        </>
                      ) : '—'}
                    </TableCell>
                    <TableCell><StatusBadge status={fee.feeStatus} /></TableCell>
                    <TableCell className="text-right">
                      {fee.balance > 0 && (
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onCollect(fee, reload); }}>Collect</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page.page} total={page.total} limit={page.limit} onPage={page.setPage} />
          </DataState>
        </CardContent>
      </Card>
    </>
  );
}

const BUCKET_TABS = [
  { value: '', label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Due today' },
  { value: 'upcoming', label: 'Upcoming' },
];

function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function DuesReport({ onCollect }) {
  const courses = useCourseOptions({ includeInactive: true });
  const [days, setDays] = useState('30');
  const [bucket, setBucket] = useState('');
  const [courseId, setCourseId] = useState('');
  const { data, loading, error, reload } = useApi('/admin/fees/dues', { days, bucket, courseId });
  const page = useClientPage(data?.items);
  const buckets = data?.buckets;
  const forecast = data?.forecast || [];
  const maxMonth = Math.max(1, ...forecast.map((f) => f.amount));
  const countFor = (value) => (!buckets ? undefined : value ? buckets[value].count : buckets.overdue.count + buckets.today.count + buckets.upcoming.count);

  const exportCsv = () => downloadCsv('fee-dues.csv', [
    { label: 'Student', value: (r) => r.student?.name },
    { label: 'Student ID', value: (r) => r.student?.studentId },
    { label: 'Phone', value: (r) => r.student?.phone },
    { label: 'Course', value: (r) => r.course?.courseName },
    { label: 'Installment', value: (r) => r.title || `#${r.installment}` },
    { label: 'Due date', value: (r) => formatDate(r.dueDate) },
    { label: 'Scheduled', value: (r) => r.scheduled },
    { label: 'Paid', value: (r) => r.paid },
    { label: 'Remaining', value: (r) => r.amountDue },
    { label: 'Days late', value: (r) => r.daysLate || '' },
  ], data?.items || []);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label="Overdue" value={buckets ? `${formatINR(buckets.overdue.amount)} · ${buckets.overdue.count}` : '—'} icon={AlertTriangle} tone="rose" onClick={() => setBucket('overdue')} />
        <KpiCard label="Due today" value={buckets ? `${formatINR(buckets.today.amount)} · ${buckets.today.count}` : '—'} icon={CalendarClock} tone="amber" onClick={() => setBucket('today')} />
        <KpiCard label={`Upcoming (${days === '0' ? 'today' : `${days} days`})`} value={buckets ? `${formatINR(buckets.upcoming.amount)} · ${buckets.upcoming.count}` : '—'} icon={CalendarDays} tone="sky" onClick={() => setBucket('upcoming')} />
        <KpiCard label="Total pending (all)" value={buckets ? formatINR(buckets.totalPending.amount) : '—'} icon={IndianRupee} tone="slate" onClick={() => setBucket('')} />
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardContent className="space-y-3 pt-3">
            <PillTabs tabs={BUCKET_TABS.map((t) => ({ ...t, count: countFor(t.value) }))} value={bucket} onChange={setBucket} />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select value={days} onChange={(e) => setDays(e.target.value)} className="sm:w-44">
                <option value="0">Upcoming: none</option>
                <option value="7">Upcoming: 7 days</option>
                <option value="15">Upcoming: 15 days</option>
                <option value="30">Upcoming: 30 days</option>
                <option value="60">Upcoming: 60 days</option>
                <option value="90">Upcoming: 90 days</option>
              </Select>
              <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="sm:w-56">
                <option value="">All courses</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.courseName}</option>)}
              </Select>
              <Button size="sm" variant="outline" className="sm:ml-auto" onClick={exportCsv} disabled={!data?.items?.length}><Download className="h-4 w-4" />Export</Button>
            </div>

            <DataState loading={loading && !data} error={error} onRetry={reload} empty={!page.total} emptyTitle="No dues here" emptyDescription="Dropped and on-hold students are not counted.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course / installment</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead className="text-right">Scheduled</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {page.rows.map((row) => (
                    <TableRow key={`${row.feeId}-${row.installment}`}>
                      <TableCell className="max-w-[12rem]">
                        <Link to={`/finance/fees/${row.feeId}`} className="font-medium hover:underline">{row.student?.name}</Link>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <a href={`tel:${row.student?.phone}`} className="flex items-center gap-1 hover:text-foreground"><Phone className="h-3 w-3" />{row.student?.phone}</a>
                          <a
                            href={whatsappLink(row.student?.phone, `Namaste ${row.student?.name}, aapki fee ${formatINR(row.amountDue)} ki due date ${formatDate(row.dueDate)} hai. – ${BUSINESSES.institute.name}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-foreground"
                            aria-label="WhatsApp reminder"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[12rem]">
                        <p className="truncate">{row.course?.courseName}</p>
                        <p className="text-xs text-muted-foreground">{row.title || `Installment ${row.installment}`}</p>
                      </TableCell>
                      <TableCell className={cn('whitespace-nowrap', row.bucket === 'overdue' && 'font-semibold text-rose-600', row.bucket === 'today' && 'font-semibold text-amber-600')}>
                        {formatDate(row.dueDate)}
                        <p className="text-[11px]">
                          {row.bucket === 'overdue' ? `${row.daysLate} day${row.daysLate === 1 ? '' : 's'} late` : row.bucket === 'today' ? 'Due today' : ''}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right text-muted-foreground">{formatINR(row.scheduled)}</TableCell>
                      <TableCell className="whitespace-nowrap text-right text-muted-foreground">{formatINR(row.paid)}</TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold">{formatINR(row.amountDue)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => onCollect({ id: row.feeId, studentId: row.student }, reload)}>Collect</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination page={page.page} total={page.total} limit={page.limit} onPage={page.setPage} />
            </DataState>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="space-y-3 pt-4">
            <div>
              <p className="font-semibold">Collection forecast</p>
              <p className="text-xs text-muted-foreground">Installments still to be paid, by due month.</p>
            </div>
            {forecast.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No future installments.</p>
            ) : (
              <div className="space-y-2.5">
                {forecast.map((row) => (
                  <div key={row.month}>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{monthLabel(row.month)}</span>
                      <span><b>{formatINR(row.amount)}</b> <span className="text-muted-foreground">· {row.count}</span></span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--color-muted))]">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${(row.amount / maxMonth) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <p className="border-t border-[hsl(var(--color-border-premium))] pt-2 text-right text-xs">
                  Next {forecast.length} months: <b>{formatINR(forecast.reduce((sum, row) => sum + row.amount, 0))}</b>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function FeesPage() {
  const navigate = useNavigate();
  const [view, setView] = useState('list');
  const [collecting, setCollecting] = useState(null);

  return (
    <div className="space-y-3">
      <PageHeader title="Fee structures" description="Course fee, discount, installments and balance for every enrollment." />
      <div className="flex gap-1.5">
        <Pill active={view === 'list'} onClick={() => setView('list')}>All fee records</Pill>
        <Pill active={view === 'dues'} onClick={() => setView('dues')}>Dues tracker & forecast</Pill>
      </div>

      {view === 'list' ? (
        <FeeList onCollect={(fee, reload) => setCollecting({ fee, reload })} />
      ) : (
        <DuesReport onCollect={(fee, reload) => setCollecting({ fee, reload })} />
      )}

      <PaymentModal
        open={Boolean(collecting)}
        onOpenChange={() => setCollecting(null)}
        student={collecting?.fee.studentId}
        feeId={collecting?.fee.id}
        onSaved={(payment) => {
          collecting?.reload();
          navigate(`/finance/payments/${payment.id}`);
        }}
      />
    </div>
  );
}
