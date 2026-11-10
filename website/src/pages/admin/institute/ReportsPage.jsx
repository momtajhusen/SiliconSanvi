import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Download, GraduationCap, IndianRupee, Printer, UserPlus, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import KpiCard from '../../../components/ui/KpiCard';
import PageHeader from '../../../components/admin/PageHeader';
import DataState from '../../../components/admin/DataState';
import PillTabs from '../../../components/admin/PillTabs';
import StatusBadge from '../../../components/admin/StatusBadge';
import { BrandTile } from '../../../components/marketing/BrandWordmark';
import { PeriodPicker, presetRange, rangeLabel } from '../../../components/traders/PeriodPicker';
import { BUSINESSES } from '../../../constants/site';
import { paymentModeLabel } from '../../../constants/institute';
import { cn } from '../../../lib/utils';
import { downloadCsv, formatDate, formatINR, labelize } from '../../../lib/format';
import { useApi } from '../../../hooks/useApi';

const TABS = [
  { value: 'summary', label: 'Summary' },
  { value: 'collection', label: 'Fee collection' },
  { value: 'dues', label: 'Fee dues' },
  { value: 'admissions', label: 'Admissions & courses' },
  { value: 'inquiries', label: 'Inquiries' },
];

const monthLabel = (key) => new Date(`${key}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

function Section({ title, description, onExport, children }) {
  return (
    <Card className="report-block">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {onExport && <Button size="sm" variant="outline" className="no-print" onClick={onExport}><Download className="h-4 w-4" />CSV</Button>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Line({ label, value, strong, minus, tone, plain }) {
  const shown = plain ? value : formatINR(value);
  return (
    <div className={cn('flex justify-between gap-3 py-1.5 text-sm', strong && 'mt-1 border-t border-[hsl(var(--color-border-premium))] pt-2 text-base font-bold')}>
      <span className={strong ? '' : 'text-muted-foreground'}>{label}</span>
      <span className={cn('font-semibold', tone)}>{minus ? `− ${shown}` : shown}</span>
    </div>
  );
}

function MonthChart({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.collected));
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted-foreground">Nothing recorded in this period.</p>;
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.month}>
          <div className="flex justify-between text-sm">
            <span className="font-medium">{monthLabel(r.month)} <span className="text-xs text-muted-foreground">· {r.admissions} admissions · {r.enrollments} enrolled</span></span>
            <span className="font-semibold">{formatINR(r.collected)}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[hsl(var(--color-muted))]"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-700" style={{ width: `${(r.collected / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function SummaryTab({ r }) {
  const s = r.summary;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Section title="Fees" description={`${s.feeStructures} fee structures created · ${s.payments} receipts in this period`}>
        <Line label="Gross fees set" value={s.grossFees} />
        {s.discounts > 0 && <Line label="Discounts & scholarships" value={s.discounts} minus />}
        <Line label="Net fees billed" value={s.billed} strong />
        <Line label="Fees collected (incl. late fees)" value={s.collected} tone="text-emerald-600" />
        {s.lateFees > 0 && <Line label="of which late fees" value={s.lateFees} />}
        <Line label="Outstanding now (all students)" value={s.outstanding} tone={s.outstanding > 0 ? 'text-rose-600' : ''} />
        <Line label={`Overdue now · ${s.overdueStudents} students`} value={s.overdue} tone={s.overdue > 0 ? 'text-rose-600' : ''} />
      </Section>
      <Section title="Month by month" description="Fees collected, admissions and enrollments">
        <MonthChart rows={r.byMonth} />
      </Section>
      <Section title="Students">
        <Line label="New admissions" value={s.admissions} plain />
        <Line label="New enrollments" value={s.enrollments} plain />
        <Line label="Course inquiries" value={s.inquiries} plain />
        <Line label="Inquiries converted to students" value={s.converted} plain />
        <Line label="Conversion rate (inquiries in period)" value={`${s.conversionRate}%`} plain strong />
      </Section>
      <Section title="Collected by payment mode">
        {Object.keys(r.byMode).length
          ? Object.entries(r.byMode).sort(([, a], [, b]) => b - a).map(([mode, amount]) => <Line key={mode} label={paymentModeLabel(mode)} value={amount} />)
          : <p className="py-4 text-center text-sm text-muted-foreground">No payments in this period.</p>}
        {Object.keys(r.byMode).length > 0 && <Line label="Total collected" value={s.collected} strong tone="text-emerald-600" />}
      </Section>
    </div>
  );
}

function CollectionTab({ r, range }) {
  const exportPayments = () => downloadCsv(`silicon-fee-collection${range}.csv`, [
    { label: 'Receipt', value: (x) => x.receiptNumber }, { label: 'Date', value: (x) => formatDate(x.paymentDate) },
    { label: 'Student', value: (x) => x.student?.name }, { label: 'Student ID', value: (x) => x.student?.studentId }, { label: 'Course', value: (x) => x.course },
    { label: 'For', value: (x) => `${labelize(x.paymentFor)}${x.installmentNumber ? ` #${x.installmentNumber}` : ''}` },
    { label: 'Mode', value: (x) => paymentModeLabel(x.mode) }, { label: 'Transaction', value: (x) => x.transactionId },
    { label: 'Amount', value: (x) => x.amount }, { label: 'Late fee', value: (x) => x.lateFee }, { label: 'Total', value: (x) => x.total },
  ], r.payments);
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <Section title="By payment mode" description={`${r.payments.length} receipts in this period`}>
          {Object.keys(r.byMode).length
            ? Object.entries(r.byMode).sort(([, a], [, b]) => b - a).map(([mode, amount]) => <Line key={mode} label={paymentModeLabel(mode)} value={amount} />)
            : <p className="py-4 text-center text-sm text-muted-foreground">No payments in this period.</p>}
        </Section>
        <Section title="By fee type">
          {Object.keys(r.byFor).length
            ? Object.entries(r.byFor).sort(([, a], [, b]) => b - a).map(([key, amount]) => <Line key={key} label={labelize(key)} value={amount} />)
            : <p className="py-4 text-center text-sm text-muted-foreground">No payments in this period.</p>}
        </Section>
      </div>
      <Section title="All fee receipts" onExport={exportPayments}>
        <DataState empty={!r.payments.length} emptyTitle="No payments in this period" emptyAction={<Link to="/finance/payments"><Button size="sm" variant="outline">Collect a fee</Button></Link>}>
          <Table>
            <TableHeader><TableRow><TableHead>Receipt</TableHead><TableHead>Student</TableHead><TableHead>Course</TableHead><TableHead>Mode</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
            <TableBody>
              {r.payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap"><Link to={`/finance/payments/${p.id}`} className="font-medium text-blue-700 hover:underline dark:text-blue-300">{p.receiptNumber}</Link><p className="text-xs text-muted-foreground">{formatDate(p.paymentDate)}</p></TableCell>
                  <TableCell><p className="font-medium">{p.student?.name}</p><p className="text-xs text-muted-foreground">{p.student?.studentId}</p></TableCell>
                  <TableCell className="text-sm">{p.course}</TableCell>
                  <TableCell className="text-sm">{paymentModeLabel(p.mode)}{p.transactionId ? ` · ${p.transactionId}` : ''}</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold">{formatINR(p.total)}{p.lateFee > 0 && <span className="block text-[11px] font-normal text-muted-foreground">incl. late fee {formatINR(p.lateFee)}</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="font-bold"><TableCell colSpan={4}>Total</TableCell><TableCell className="text-right">{formatINR(r.summary.collected)}</TableCell></TableRow>
            </TableFooter>
          </Table>
        </DataState>
      </Section>
    </div>
  );
}

function DuesTab({ r }) {
  const exportDues = () => downloadCsv('silicon-fee-dues.csv', [
    { label: 'Student', value: (x) => x.student?.name }, { label: 'Student ID', value: (x) => x.student?.studentId }, { label: 'Phone', value: (x) => x.student?.phone },
    { label: 'Course', value: (x) => x.course }, { label: 'Net fee', value: (x) => x.netFee }, { label: 'Paid', value: (x) => x.paid }, { label: 'Balance', value: (x) => x.balance },
    { label: 'Overdue', value: (x) => x.overdueAmount }, { label: 'Next due', value: (x) => formatDate(x.nextDueDate) }, { label: 'Days overdue', value: (x) => x.daysOverdue }, { label: 'Status', value: (x) => x.feeStatus },
  ], r.dues);
  return (
    <div className="space-y-3">
      <Section title="Dues by age" description="All students with a balance, whatever the period">
        {r.ageing.map((a) => (
          <div key={a.label} className="flex justify-between py-1.5 text-sm">
            <span className="text-muted-foreground">{a.label} <span className="text-xs">({a.students} students)</span></span>
            <span className={cn('font-semibold', a.amount > 0 && a.label.startsWith('90') && 'text-rose-600')}>{formatINR(a.amount)}</span>
          </div>
        ))}
        <Line label="Total outstanding" value={r.summary.outstanding} strong tone="text-rose-600" />
      </Section>
      <Section title="Students who still owe" onExport={exportDues}>
        <DataState empty={!r.dues.length} emptyTitle="Nothing due — every student is paid up">
          <Table>
            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Course</TableHead><TableHead>Next due</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Overdue</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader>
            <TableBody>
              {r.dues.map((d) => (
                <TableRow key={d.id}>
                  <TableCell><Link to={`/finance/fees/${d.id}`} className="font-medium hover:underline">{d.student?.name}</Link><p className="text-xs text-muted-foreground">{d.student?.studentId} · {d.student?.phone}</p></TableCell>
                  <TableCell className="text-sm">{d.course}</TableCell>
                  <TableCell className="whitespace-nowrap"><span className="mr-1.5">{formatDate(d.nextDueDate)}</span><StatusBadge status={d.feeStatus} />{d.daysOverdue > 0 && <span className="block text-[11px] text-rose-600">{d.daysOverdue} days late</span>}</TableCell>
                  <TableCell className="whitespace-nowrap text-right text-emerald-600">{formatINR(d.paid)}</TableCell>
                  <TableCell className={cn('whitespace-nowrap text-right', d.overdueAmount > 0 && 'font-semibold text-rose-600')}>{d.overdueAmount > 0 ? formatINR(d.overdueAmount) : '—'}</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold">{formatINR(d.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
      </Section>
    </div>
  );
}

function AdmissionsTab({ r, range }) {
  const rows = r.byCourse;
  const sum = (key) => rows.reduce((t, x) => t + x[key], 0);
  const exportCourses = () => downloadCsv(`silicon-courses${range}.csv`, [
    { label: 'Course', value: (x) => x.name }, { label: 'Admissions', value: (x) => x.admissions }, { label: 'Enrollments', value: (x) => x.enrollments },
    { label: 'Net fees billed', value: (x) => x.billed }, { label: 'Collected', value: (x) => x.collected }, { label: 'Outstanding now', value: (x) => x.outstanding },
  ], rows);
  return (
    <div className="space-y-3">
      <Section title="Course-wise" description="Admissions, enrollments and fees per course in this period" onExport={exportCourses}>
        <DataState empty={!rows.length} emptyTitle="No admissions or payments in this period">
          <Table>
            <TableHeader><TableRow><TableHead>Course</TableHead><TableHead className="text-right">Admissions</TableHead><TableHead className="text-right">Enrolled</TableHead><TableHead className="text-right">Billed</TableHead><TableHead className="text-right">Collected</TableHead><TableHead className="text-right">Outstanding</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((x) => (
                <TableRow key={x.courseId}>
                  <TableCell><Link to={`/academics/courses/${x.courseId}`} className="font-medium hover:underline">{x.name}</Link></TableCell>
                  <TableCell className="text-right">{x.admissions}</TableCell>
                  <TableCell className="text-right">{x.enrollments}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">{formatINR(x.billed)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right text-emerald-600">{formatINR(x.collected)}</TableCell>
                  <TableCell className={cn('whitespace-nowrap text-right', x.outstanding > 0 && 'font-semibold text-rose-600')}>{formatINR(x.outstanding)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="font-bold">
                <TableCell>Total</TableCell><TableCell className="text-right">{sum('admissions')}</TableCell><TableCell className="text-right">{sum('enrollments')}</TableCell>
                <TableCell className="text-right">{formatINR(sum('billed'))}</TableCell><TableCell className="text-right">{formatINR(sum('collected'))}</TableCell><TableCell className="text-right">{formatINR(sum('outstanding'))}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </DataState>
      </Section>
      <div className="grid gap-3 lg:grid-cols-2">
        <Section title="Admissions by source">
          {Object.keys(r.bySource).length
            ? Object.entries(r.bySource).map(([key, count]) => <Line key={key} label={labelize(key)} value={count} plain />)
            : <p className="py-4 text-center text-sm text-muted-foreground">No admissions in this period.</p>}
        </Section>
        <Section title="Enrollments by status">
          {Object.keys(r.enrollmentStatus).length
            ? Object.entries(r.enrollmentStatus).map(([key, count]) => <Line key={key} label={labelize(key)} value={count} plain />)
            : <p className="py-4 text-center text-sm text-muted-foreground">No enrollments in this period.</p>}
        </Section>
      </div>
    </div>
  );
}

function InquiriesTab({ r, range }) {
  const rows = r.leadSources;
  const exportCsv = () => downloadCsv(`silicon-inquiries${range}.csv`, [
    { label: 'Source', value: (x) => labelize(x.source) }, { label: 'Inquiries', value: (x) => x.inquiries }, { label: 'Converted', value: (x) => x.converted }, { label: 'Still open', value: (x) => x.open },
  ], rows);
  return (
    <Section title="Course inquiries by lead source" description={`${r.summary.inquiries} inquiries · ${r.summary.conversionRate}% became students`} onExport={exportCsv}>
      <DataState empty={!rows.length} emptyTitle="No course inquiries in this period" emptyAction={<Link to="/admissions/inquiries"><Button size="sm" variant="outline">Open inquiries</Button></Link>}>
        <Table>
          <TableHeader><TableRow><TableHead>Source</TableHead><TableHead className="text-right">Inquiries</TableHead><TableHead className="text-right">Converted</TableHead><TableHead className="text-right">Still open</TableHead><TableHead className="text-right">Conversion</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((x) => (
              <TableRow key={x.source}>
                <TableCell className="font-medium">{labelize(x.source)}</TableCell>
                <TableCell className="text-right">{x.inquiries}</TableCell>
                <TableCell className="text-right text-emerald-600">{x.converted}</TableCell>
                <TableCell className="text-right">{x.open}</TableCell>
                <TableCell className="text-right font-semibold">{Math.round((x.converted / x.inquiries) * 100)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataState>
    </Section>
  );
}

export default function InstituteReportsPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'summary';
  const [period, setPeriod] = useState(() => presetRange('month'));
  const { from, to } = period;
  const { data, loading, error, reload } = useApi('/admin/institute/reports', { from, to });
  const rangeSuffix = `${from ? `-${from}` : ''}${to ? `-to-${to}` : ''}`;
  const info = BUSINESSES.institute;
  const s = data?.summary;

  useEffect(() => {
    const previous = document.title;
    document.title = `${info.name} - ${TABS.find((t) => t.value === tab).label} report`;
    return () => { document.title = previous; };
  }, [tab, info.name]);

  return (
    <div className="space-y-3">
      <div className="no-print">
        <PageHeader
          title="Institute reports"
          description="Silicon Computer Institute: fee collection, dues, admissions, courses and inquiries for any date range or year."
          actions={<Button size="sm" onClick={() => window.print()} disabled={!data}><Printer className="h-4 w-4" />Print / Save PDF</Button>}
        />
      </div>

      <div className="hidden items-center justify-between border-b border-slate-300 pb-3 print:flex">
        <div className="flex items-center gap-3">
          <BrandTile business="institute" size="md" />
          <div>
            <p className="text-lg font-extrabold">{info.name}</p>
            <p className="text-xs text-slate-500">{info.address} · {info.phone}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">{TABS.find((t) => t.value === tab).label} report</p>
          <p className="text-xs text-slate-500">{rangeLabel(period)}</p>
        </div>
      </div>

      <Card className="no-print">
        <CardContent className="pt-3">
          <PeriodPicker value={period} onChange={setPeriod} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label={`Fees collected · ${s?.payments ?? 0} receipts`} value={s ? formatINR(s.collected) : '—'} icon={Wallet} tone="emerald" onClick={() => setParams({ tab: 'collection' })} />
        <KpiCard label={`Admissions · ${s?.enrollments ?? 0} enrolled`} value={s ? s.admissions : '—'} icon={UserPlus} tone="blue" onClick={() => setParams({ tab: 'admissions' })} />
        <KpiCard label="Outstanding (all students)" value={s ? formatINR(s.outstanding) : '—'} icon={IndianRupee} tone="slate" onClick={() => setParams({ tab: 'dues' })} />
        <KpiCard label={s ? `Overdue · ${s.overdueStudents} students` : 'Overdue'} value={s ? formatINR(s.overdue) : '—'} icon={s?.overdue ? AlertTriangle : GraduationCap} tone="rose" onClick={() => setParams({ tab: 'dues' })} />
      </div>

      <div className="no-print"><PillTabs tabs={TABS} value={tab} onChange={(value) => setParams({ tab: value })} /></div>

      <DataState loading={loading && !data} error={error} onRetry={reload} rows={6}>
        {data && (
          <>
            {tab === 'summary' && <SummaryTab r={data} />}
            {tab === 'collection' && <CollectionTab r={data} range={rangeSuffix} />}
            {tab === 'dues' && <DuesTab r={data} />}
            {tab === 'admissions' && <AdmissionsTab r={data} range={rangeSuffix} />}
            {tab === 'inquiries' && <InquiriesTab r={data} range={rangeSuffix} />}
          </>
        )}
      </DataState>
    </div>
  );
}