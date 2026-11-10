import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, BookOpenCheck, CalendarClock, Globe, GraduationCap, IndianRupee, Layers, PhoneCall, RefreshCw, UserPlus, Wallet,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import KpiCard from '../../components/ui/KpiCard';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/Alert';
import StatusBadge from '../../components/admin/StatusBadge';
import BusinessesOverview from '../../components/traders/BusinessesOverview';
import { BusinessChip } from '../../components/traders/TradersKit';
import { formatDate, formatINR } from '../../lib/format';

function TrendChart({ trend }) {
  const max = Math.max(1, ...trend.map((d) => d.count));
  const total = trend.reduce((sum, d) => sum + d.count, 0);
  return (
    <>
      <div className="flex h-40 items-end gap-1.5">
        {trend.map((day, index) => (
          <div key={day.date} className="group relative flex h-full flex-1 items-end">
            <div
              title={`${formatDate(day.date)}: ${day.count}`}
              className="w-full origin-bottom rounded-t-md bg-gradient-to-t from-blue-900 to-blue-500 animate-bar-rise"
              style={{ height: `${Math.max(4, (day.count / max) * 100)}%`, opacity: day.count ? 1 : 0.25, animationDelay: `${150 + index * 40}ms` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>{formatDate(trend[0]?.date)}</span>
        <span>{total} admissions</span>
        <span>Today</span>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi('/admin/dashboard');
  const k = data?.kpis;
  const show = (value, fmt = (v) => v) => (k ? fmt(value) : '—');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name || 'Admin'}. Here is what is happening across both businesses today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reload} loading={loading && Boolean(data)}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => navigate('/students/new')}>
            <UserPlus className="h-4 w-4" />
            New admission
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Could not load dashboard</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <BusinessesOverview instituteKpis={k} />

      <BusinessChip business="institute" className="mt-2" />
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label="Active students" value={show(k?.activeStudents)} icon={GraduationCap} onClick={() => navigate('/students')} />
        <KpiCard label="Running batches" value={show(k?.runningBatches)} icon={Layers} tone="sky" onClick={() => navigate('/academics/batches')} />
        <KpiCard label="Fees this month" value={show(k?.feesThisMonth, formatINR)} icon={IndianRupee} tone="violet" onClick={() => navigate('/finance/payments')} />
        <KpiCard label="New inquiries" value={show(k?.newInquiries)} icon={PhoneCall} tone="amber" onClick={() => navigate('/admissions/inquiries')} />
        <KpiCard label="Online applications" value={show(k?.pendingOnline)} icon={Globe} tone="blue" onClick={() => navigate('/admissions/online')} />
        <KpiCard label="Follow-ups due" value={show(k?.followUpsDue)} icon={CalendarClock} tone="orange" onClick={() => navigate('/admissions/inquiries')} />
        <KpiCard label="Pending dues" value={show(k?.pendingDues, formatINR)} icon={Wallet} tone="slate" onClick={() => navigate('/finance/fees')} />
        <KpiCard label="Overdue students" value={show(k?.overdueCount)} icon={AlertTriangle} tone="rose" onClick={() => navigate('/finance/fees')} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle>Recent admissions</CardTitle>
              <CardDescription>Latest students and their fee status</CardDescription>
            </div>
            <Link to="/students" className="text-xs font-medium text-blue-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {data && !data.recentAdmissions.length ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">No students yet.</p>
                <Button size="sm" className="mt-3" onClick={() => navigate('/students/new')}>Add first admission</Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead className="text-right">Admitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.recentAdmissions || []).map((row) => (
                    <TableRow key={row.id} className="cursor-pointer" onClick={() => navigate(`/students/${row.id}`)}>
                      <TableCell className="font-medium">{row.studentId}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.course}</TableCell>
                      <TableCell><StatusBadge status={row.feeStatus} /></TableCell>
                      <TableCell className="whitespace-nowrap text-right text-muted-foreground">{formatDate(row.admissionDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admissions</CardTitle>
            <CardDescription>Last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            {data ? <TrendChart trend={data.trend} /> : <div className="h-40 animate-pulse rounded-lg bg-muted" />}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={() => navigate('/finance/payments')}><IndianRupee className="h-4 w-4" />Collect fee</Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/enrollments')}><BookOpenCheck className="h-4 w-4" />Enroll</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {data?.overdue?.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle>Overdue fees</CardTitle>
              <CardDescription>Students who have missed an installment</CardDescription>
            </div>
            <Link to="/finance/fees" className="text-xs font-medium text-blue-600 hover:underline">Dues report</Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Due since</TableHead>
                  <TableHead className="text-right">Overdue</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.overdue.map((row) => (
                  <TableRow key={row.id} className="cursor-pointer" onClick={() => navigate(`/finance/fees/${row.id}`)}>
                    <TableCell>
                      <p className="font-medium">{row.student?.name}</p>
                      <p className="text-xs text-muted-foreground">{row.student?.phone}</p>
                    </TableCell>
                    <TableCell>{row.course}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(row.nextDueDate)}</TableCell>
                    <TableCell className="text-right font-semibold text-rose-600">{formatINR(row.overdueAmount)}</TableCell>
                    <TableCell className="text-right">{formatINR(row.balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
