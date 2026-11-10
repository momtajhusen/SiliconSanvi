import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, BarChart3, BookOpenCheck, CalendarClock, CalendarDays, GraduationCap, IndianRupee, PhoneCall, Plus, RefreshCw, UserPlus, Wallet,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import KpiCard from '../../../components/ui/KpiCard';
import { FormBanner } from '../../../components/ui/FormBanner';
import PageHeader from '../../../components/admin/PageHeader';
import DataState from '../../../components/admin/DataState';
import StatusBadge from '../../../components/admin/StatusBadge';
import { paymentModeLabel } from '../../../constants/institute';
import { formatDate, formatINR } from '../../../lib/format';
import { useApi } from '../../../hooks/useApi';

const ACTIONS = [
  { to: '/students/new', label: 'New admission', icon: UserPlus },
  { to: '/enrollments', label: 'Enroll', icon: BookOpenCheck },
  { to: '/finance/payments', label: 'Collect fee', icon: IndianRupee },
  { to: '/admissions/inquiries', label: 'Inquiries', icon: PhoneCall },
  { to: '/finance/fees', label: 'Fee dues', icon: Wallet },
  { to: '/institute/reports', label: 'Reports', icon: BarChart3 },
];

export default function InstituteOverviewPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi('/admin/institute/overview');
  const k = data?.kpis;
  const show = (value, fmt = (v) => v) => (k ? fmt(value) : '—');

  return (
    <div className="space-y-3">
      <PageHeader
        title="Institute overview"
        description="Silicon Computer Institute only: this month's admissions and fee collection, money due and today's follow-ups."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={reload} loading={loading && Boolean(data)}><RefreshCw className="h-4 w-4" />Refresh</Button>
            <Button size="sm" onClick={() => navigate('/students/new')}><Plus className="h-4 w-4" />New admission</Button>
          </>
        }
      />
      {error && <FormBanner tone="error" title="Could not load overview">{error}</FormBanner>}

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label={`Fees collected this month · ${show(k?.monthPayments)} receipts`} value={show(k?.monthCollected, formatINR)} icon={Wallet} tone="emerald" onClick={() => navigate('/institute/reports?tab=collection')} />
        <KpiCard label={`Admissions this month · ${show(k?.monthEnrollments)} enrolled`} value={show(k?.monthAdmissions)} icon={UserPlus} tone="blue" onClick={() => navigate('/institute/reports?tab=admissions')} />
        <KpiCard label={`Course inquiries this month · ${show(k?.monthConverted)} converted`} value={show(k?.monthInquiries)} icon={PhoneCall} tone="amber" onClick={() => navigate('/institute/reports?tab=inquiries')} />
        <KpiCard label={`Active students · ${show(k?.activeEnrollments)} enrollments`} value={show(k?.activeStudents)} icon={GraduationCap} tone="violet" onClick={() => navigate('/students')} />
        <KpiCard label="Fees outstanding" value={show(k?.outstanding, formatINR)} icon={IndianRupee} tone="slate" onClick={() => navigate('/institute/reports?tab=dues')} />
        <KpiCard label={`Overdue · ${show(k?.overdueStudents)} students`} value={show(k?.overdue, formatINR)} icon={AlertTriangle} tone="rose" onClick={() => navigate('/institute/reports?tab=dues')} />
        <KpiCard label="Due in the next 7 days" value={show(k?.dueThisWeek, formatINR)} icon={CalendarDays} tone="sky" onClick={() => navigate('/finance/fees')} />
        <KpiCard label="Follow-ups due today" value={show(k?.followUpsDue)} icon={CalendarClock} tone="orange" onClick={() => navigate('/admissions/inquiries')} />
      </div>

      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <Link key={a.to + a.label} to={a.to} className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/5 px-3.5 py-1.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-500/15 dark:text-blue-300">
            <a.icon className="h-3.5 w-3.5" />{a.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fees due soon</CardTitle>
            <CardDescription>Installments due in the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <DataState loading={loading && !data} empty={!data?.upcoming?.length} emptyTitle="Nothing due this week">
              <Table>
                <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Due</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data?.upcoming?.map((d) => (
                    <TableRow key={d.id} className="cursor-pointer" onClick={() => navigate(`/finance/fees/${d.id}`)}>
                      <TableCell><p className="font-medium">{d.student?.name}</p><p className="text-xs text-muted-foreground">{d.course}</p></TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(d.nextDueDate)}</TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold">{formatINR(d.nextDueAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Follow-ups due</CardTitle>
            <CardDescription>Open inquiries to call today or earlier</CardDescription>
          </CardHeader>
          <CardContent>
            <DataState loading={loading && !data} empty={!data?.followUps?.length} emptyTitle="No follow-ups due">
              <Table>
                <TableHeader><TableRow><TableHead>Inquiry</TableHead><TableHead>Course</TableHead><TableHead className="text-right">Follow up</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data?.followUps?.map((q) => (
                    <TableRow key={q.id} className="cursor-pointer" onClick={() => navigate(`/admissions/inquiries/${q.id}`)}>
                      <TableCell><p className="font-medium">{q.name}</p><p className="text-xs text-muted-foreground">{q.phone}</p></TableCell>
                      <TableCell className="text-sm">{q.courseId?.courseName || q.courseInterest || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">{formatDate(q.followUpDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataState>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base">Recent fee payments</CardTitle>
            <CardDescription>Latest receipts</CardDescription>
          </div>
          <Link to="/finance/payments" className="text-xs font-medium text-blue-600 hover:underline">All payments</Link>
        </CardHeader>
        <CardContent>
          <DataState loading={loading && !data} empty={!data?.recentPayments?.length} emptyTitle="No payments yet" emptyAction={<Button size="sm" variant="outline" onClick={() => navigate('/finance/payments')}>Collect a fee</Button>}>
            <Table>
              <TableHeader><TableRow><TableHead>Receipt</TableHead><TableHead>Student</TableHead><TableHead>Mode</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {data?.recentPayments?.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/finance/payments/${p.id}`)}>
                    <TableCell className="whitespace-nowrap"><p className="font-medium text-blue-700 dark:text-blue-300">{p.receiptNumber}</p><p className="text-xs text-muted-foreground">{formatDate(p.paymentDate)}</p></TableCell>
                    <TableCell><p className="font-medium">{p.student?.name}</p><p className="text-xs text-muted-foreground">{p.student?.studentId}</p></TableCell>
                    <TableCell className="text-sm">{paymentModeLabel(p.mode)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold">{formatINR(p.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataState>
        </CardContent>
      </Card>

      {k && k.overdueStudents > 0 && (
        <p className="text-xs text-muted-foreground">
          <StatusBadge status="overdue" className="mr-1.5" />
          {k.overdueStudents} students have missed an installment. See <Link to="/institute/reports?tab=dues" className="font-medium text-blue-600 hover:underline">Reports → Fee dues</Link>.
        </p>
      )}
    </div>
  );
}
