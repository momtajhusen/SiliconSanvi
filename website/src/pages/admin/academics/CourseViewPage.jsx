import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { BookOpenCheck, CheckCircle2, IndianRupee, Layers, Pencil, Power, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import KpiCard from '../../../components/ui/KpiCard';
import { Skeleton } from '../../../components/ui/Loader';
import { FormBanner } from '../../../components/ui/FormBanner';
import PageHeader from '../../../components/admin/PageHeader';
import StatusBadge from '../../../components/admin/StatusBadge';
import Info, { InfoGrid } from '../../../components/admin/Info';
import CourseFormModal from '../../../components/admin/CourseFormModal';
import { formatDate, formatINR, formatTiming, initials, labelize } from '../../../lib/format';
import { useApi } from '../../../hooks/useApi';
import api, { apiError, mediaUrl } from '../../../lib/api';

const lines = (text) => String(text || '').split('\n').map((line) => line.replace(/^\s*[-*•\d.)]+\s*/, '').trim()).filter(Boolean);

export default function CourseViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi(`/admin/courses/${id}`);
  const [editing, setEditing] = useState(false);

  if (loading && !data) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-72 w-full" /></div>;
  if (error) return <FormBanner tone="error" title="Could not load course">{error}</FormBanner>;
  if (!data) return null;
  const { course, batches, enrollmentCounts, fees, recentEnrollments } = data;
  const activeStudents = (enrollmentCounts.enrolled || 0) + (enrollmentCounts.in_progress || 0);
  const totalEnrollments = Object.values(enrollmentCounts).reduce((a, b) => a + b, 0);
  const openBatches = batches.filter((b) => ['upcoming', 'active'].includes(b.status));
  const syllabus = lines(course.syllabus);
  const outcomes = lines(course.learningOutcomes);

  const toggle = async () => {
    const next = course.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/admin/courses/${course.id}`, { status: next });
      toast.success(`Course is now ${next}`);
      reload();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        back={{ to: '/academics/courses', label: 'Courses' }}
        title={course.courseName}
        description={`${course.courseCode} · ${labelize(course.courseType)} · ${labelize(course.level)} · ${course.durationMonths} months`}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => navigate(`/enrollments?courseId=${course.id}`)}><BookOpenCheck className="h-4 w-4" />Enrollments</Button>
            <Button size="sm" variant="outline" onClick={toggle}><Power className="h-4 w-4" />{course.status === 'active' ? 'Mark inactive' : 'Mark active'}</Button>
            <Button size="sm" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Edit</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Active students" value={activeStudents} icon={Users} tone="sky" />
        <KpiCard label="Completed" value={enrollmentCounts.completed || 0} icon={CheckCircle2} tone="violet" />
        <KpiCard label="Open batches" value={openBatches.length} icon={Layers} tone="slate" />
        <KpiCard label="Fee collected" value={formatINR(fees.collected)} icon={IndianRupee} tone="sky" />
        <KpiCard label="Fee balance" value={formatINR(fees.balance)} icon={IndianRupee} tone={fees.balance > 0 ? 'amber' : 'slate'} className="col-span-2 sm:col-span-1" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-3">
          <Card className="overflow-hidden">
            {course.image && <img src={mediaUrl(course.image)} alt={course.courseName} className="h-40 w-full object-cover" />}
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{course.courseName}</p>
                <StatusBadge status={course.status} />
              </div>
              {course.shortDescription && <p className="text-sm text-muted-foreground">{course.shortDescription}</p>}
              <InfoGrid className="sm:grid-cols-2">
                <Info label="Course fee" value={formatINR(course.baseFee)} />
                <Info label="Admission fee" value={formatINR(course.admissionFee)} />
                <Info label="Exam fee" value={formatINR(course.examFee)} />
                <Info label="Total (new student)" value={formatINR((course.baseFee || 0) + (course.admissionFee || 0) + (course.examFee || 0))} />
                <Info label="Duration" value={`${course.durationMonths} months`} />
                <Info label="Website slug" value={course.slug} />
              </InfoGrid>
              {course.prerequisites && <Info label="Prerequisites" value={course.prerequisites} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Enrollments by status</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(enrollmentCounts).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2 text-sm">
                  <StatusBadge status={status} className="w-24 justify-center" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[hsl(var(--color-muted))]">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${totalEnrollments ? (count / totalEnrollments) * 100 : 0}%` }} />
                  </div>
                  <span className="w-8 text-right font-semibold">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3 lg:col-span-2">
          {(course.description || syllabus.length > 0 || outcomes.length > 0) && (
            <Card>
              <CardHeader><CardTitle>About & syllabus</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {course.description && <p className="whitespace-pre-line text-sm">{course.description}</p>}
                {syllabus.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Syllabus ({syllabus.length} topics)</p>
                    <ol className="grid gap-1.5 sm:grid-cols-2">
                      {syllabus.map((topic, index) => (
                        <li key={topic + index} className="flex gap-2 text-sm">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-900/10 text-[10px] font-bold text-blue-800 dark:text-blue-200">{index + 1}</span>
                          {topic}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {outcomes.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">What students will learn</p>
                    <ul className="list-inside list-disc space-y-1 text-sm">
                      {outcomes.map((line, index) => <li key={line + index}>{line}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Batches</CardTitle>
              <Link to="/academics/batches" className="text-xs font-medium text-blue-600 hover:underline">Manage batches</Link>
            </CardHeader>
            <CardContent>
              {batches.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No batches for this course yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch</TableHead>
                      <TableHead>Timing</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Seats</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <p className="font-medium">{b.batchName}</p>
                          <p className="text-xs text-muted-foreground">{b.batchCode}{b.faculty ? ` · ${b.faculty}` : ''}</p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatTiming(b.timingFrom, b.timingTo)}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{formatDate(b.startDate)} – {b.endDate ? formatDate(b.endDate) : 'open'}</TableCell>
                        <TableCell className={b.currentStrength >= b.maxStrength ? 'font-semibold text-rose-600' : ''}>{b.currentStrength}/{b.maxStrength}</TableCell>
                        <TableCell><StatusBadge status={b.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent students</CardTitle></CardHeader>
            <CardContent>
              {recentEnrollments.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No students enrolled yet.</p>
              ) : (
                <div className="divide-y divide-[hsl(var(--color-border-premium))]">
                  {recentEnrollments.map((row) => (
                    <Link key={row.id} to={`/enrollments/${row.id}`} className="flex items-center gap-3 py-2 hover:bg-[hsl(var(--color-muted))]/30">
                      <Avatar src={mediaUrl(row.studentId?.photo)} alt={row.studentId?.name} fallback={initials(row.studentId?.name)} className="h-8 w-8 text-xs" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{row.studentId?.name}</p>
                        <p className="text-xs text-muted-foreground">{row.studentId?.studentId} · {row.batchId?.batchName || 'No batch'} · {formatDate(row.enrollmentDate)}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{row.progressPercentage || 0}%</span>
                      <StatusBadge status={row.status} />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CourseFormModal open={editing} course={course} onOpenChange={setEditing} onSaved={reload} />
    </div>
  );
}
