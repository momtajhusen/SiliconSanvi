import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Download, GraduationCap, IndianRupee, Search, UserCheck, UserPlus, UserX } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Avatar from '../../../components/ui/Avatar';
import KpiCard from '../../../components/ui/KpiCard';
import Pagination, { useClientPage } from '../../../components/ui/Pagination';
import PageHeader from '../../../components/admin/PageHeader';
import StatusBadge from '../../../components/admin/StatusBadge';
import DataState from '../../../components/admin/DataState';
import { STUDENT_SOURCES, STUDENT_STATUSES } from '../../../constants/institute';
import { downloadCsv, formatDate, formatINR, initials, labelize } from '../../../lib/format';
import { mediaUrl } from '../../../lib/api';
import { useApi, useDebounced } from '../../../hooks/useApi';
import { useCourseOptions } from '../../../hooks/useAcademics';

export default function StudentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courses = useCourseOptions({ includeInactive: true });
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [status, setStatus] = useState(() => (searchParams.get('q') ? '' : 'active'));
  const urlQuery = searchParams.get('q');
  useEffect(() => {
    if (urlQuery) {
      setQuery(urlQuery);
      setStatus('');
    }
  }, [urlQuery]);
  const [courseId, setCourseId] = useState('');
  const [source, setSource] = useState('');
  const q = useDebounced(query.trim());
  const { data, loading, error, reload } = useApi('/admin/students', { q, status, courseId, source });
  const page = useClientPage(data?.items);
  const summary = data?.summary;

  const exportCsv = () => downloadCsv('students.csv', [
    { label: 'Student ID', value: (r) => r.studentId },
    { label: 'Name', value: (r) => r.name },
    { label: 'Phone', value: (r) => r.phone },
    { label: 'Father', value: (r) => r.fatherName },
    { label: 'Gender', value: (r) => r.gender },
    { label: 'Course', value: (r) => r.courseId?.courseName },
    { label: 'Admission date', value: (r) => formatDate(r.admissionDate) },
    { label: 'Source', value: (r) => r.source },
    { label: 'Net fee', value: (r) => r.netFee },
    { label: 'Paid', value: (r) => r.totalPaid },
    { label: 'Balance', value: (r) => r.balance },
    { label: 'Status', value: (r) => r.status },
  ], data?.items || []);

  return (
    <div className="space-y-3">
      <PageHeader
        title="Students"
        description="Admitted students, their courses and fee position."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={!data?.items?.length}><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" onClick={() => navigate('/students/new')}><UserPlus className="h-4 w-4" />New admission</Button>
          </>
        }
      />

      {summary && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard label="Total students" value={summary.total} icon={GraduationCap} tone="slate" onClick={() => setStatus('')} />
          <KpiCard label="Active" value={summary.byStatus.active || 0} icon={UserCheck} tone="sky" onClick={() => setStatus('active')} />
          <KpiCard label="Active, not enrolled" value={summary.notEnrolled} icon={UserX} tone="amber" />
          <KpiCard label="Completed" value={summary.byStatus.completed || 0} icon={CheckCircle2} tone="violet" onClick={() => setStatus('completed')} />
          <KpiCard label="Fee balance due" value={formatINR(summary.balanceDue)} icon={IndianRupee} tone="rose" className="col-span-2 sm:col-span-1" onClick={() => navigate('/finance/fees')} />
        </div>
      )}

      <Card>
        <CardContent className="space-y-3 pt-3">
          <div className="flex flex-col gap-2 lg:flex-row">
            <Input placeholder="Search name, phone, STU no, father…" iconLeft={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} className="lg:max-w-xs" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex">
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="lg:w-36">
                <option value="">All status</option>
                {STUDENT_STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
              </Select>
              <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="lg:w-52">
                <option value="">All courses</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.courseName}</option>)}
              </Select>
              <Select value={source} onChange={(e) => setSource(e.target.value)} className="col-span-2 sm:col-span-1 lg:w-44">
                <option value="">Any source</option>
                {STUDENT_SOURCES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
              </Select>
            </div>
          </div>

          <DataState
            loading={loading && !data}
            error={error}
            onRetry={reload}
            empty={!page.total}
            emptyTitle="No students found"
            emptyAction={<Button size="sm" variant="outline" onClick={() => navigate('/students/new')}>Add first student</Button>}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Admission</TableHead>
                  <TableHead className="text-right">Paid / Net fee</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.rows.map((student) => (
                  <TableRow key={student.id} className="cursor-pointer" onClick={() => navigate(`/students/${student.id}`)}>
                    <TableCell className="max-w-[16rem]">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={mediaUrl(student.photo)} alt={student.name} fallback={initials(student.name)} className="h-8 w-8 shrink-0 text-xs" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.studentId} · {student.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[12rem]">
                      <p>{student.courseId?.courseName || '—'}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.activeEnrollments ? `${student.activeEnrollments} active enrollment${student.activeEnrollments > 1 ? 's' : ''}` : 'Not enrolled'}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(student.admissionDate)}
                      {student.source !== 'office' && <p className="text-[11px] text-muted-foreground">{labelize(student.source)}</p>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {formatINR(student.totalPaid)} <span className="text-muted-foreground">/ {formatINR(student.netFee)}</span>
                    </TableCell>
                    <TableCell className={`whitespace-nowrap text-right font-semibold ${student.balance > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      {formatINR(student.balance)}
                    </TableCell>
                    <TableCell><StatusBadge status={student.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page.page} total={page.total} limit={page.limit} onPage={page.setPage} />
          </DataState>
        </CardContent>
      </Card>
    </div>
  );
}
