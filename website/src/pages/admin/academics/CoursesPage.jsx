import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, Image as ImageIcon, Pencil, Plus, Power, Search, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import RowActions from '../../../components/admin/RowActions';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import PageHeader from '../../../components/admin/PageHeader';
import StatusBadge from '../../../components/admin/StatusBadge';
import DataState from '../../../components/admin/DataState';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import CourseFormModal from '../../../components/admin/CourseFormModal';
import { ENTITY_STATUSES } from '../../../constants/institute';
import { formatINR, labelize } from '../../../lib/format';
import { useApi } from '../../../hooks/useApi';
import api, { apiError, mediaUrl } from '../../../lib/api';

export default function CoursesPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi('/admin/courses');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.items || []).filter((course) => {
      if (status !== 'all' && course.status !== status) return false;
      return !q || course.courseName.toLowerCase().includes(q) || course.courseCode.toLowerCase().includes(q);
    });
  }, [data, query, status]);

  const toggle = async (course) => {
    const next = course.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/admin/courses/${course.id}`, { status: next });
      toast.success(`${course.courseName} is now ${next}`);
      reload();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/courses/${deleting.id}`);
      toast.success('Course deleted');
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
        title="Courses"
        description="Courses offered by the institute, with default fees used for new enrollments."
        actions={<Button size="sm" onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Add course</Button>}
      />

      <Card>
        <CardContent className="space-y-3 pt-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input placeholder="Search courses…" iconLeft={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} className="sm:max-w-xs" />
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40">
              <option value="all">All status</option>
              {ENTITY_STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
            </Select>
          </div>

          <DataState loading={loading && !data} error={error} onRetry={reload} empty={!rows.length} emptyTitle="No courses found">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Course fee</TableHead>
                  <TableHead className="text-right">Adm. + Exam</TableHead>
                  <TableHead>Batches</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="max-w-[20rem]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[hsl(var(--color-muted))] text-muted-foreground">
                          {course.image ? (
                            <img src={mediaUrl(course.image)} alt="" className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <ImageIcon className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link to={`/academics/courses/${course.id}`} className="block truncate font-medium hover:underline">{course.courseName}</Link>
                          <p className="text-xs text-muted-foreground">{course.courseCode} · {labelize(course.courseType)} · {labelize(course.level)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{course.durationMonths} mo</TableCell>
                    <TableCell className="text-right font-semibold">{formatINR(course.baseFee)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatINR(course.admissionFee)} + {formatINR(course.examFee)}</TableCell>
                    <TableCell>{course.openBatches}</TableCell>
                    <TableCell>{course.activeStudents}</TableCell>
                    <TableCell>
                      <button type="button" onClick={() => toggle(course)} title="Click to toggle active / inactive">
                        <StatusBadge status={course.status} />
                      </button>
                    </TableCell>
                    <TableCell>
                      <RowActions
                        actions={[
                          { icon: Eye, label: 'View details', onClick: () => navigate(`/academics/courses/${course.id}`) },
                          { icon: Pencil, label: 'Edit', onClick: () => setEditing(course) },
                          { icon: Power, label: course.status === 'active' ? 'Mark inactive' : 'Mark active', onClick: () => toggle(course) },
                          { icon: Trash2, label: 'Delete', tone: 'danger', onClick: () => setDeleting(course) },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataState>
        </CardContent>
      </Card>

      <CourseFormModal open={Boolean(editing)} course={editing === 'new' ? null : editing} onOpenChange={() => setEditing(null)} onSaved={reload} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={() => setDeleting(null)}
        title="Delete course?"
        description={deleting ? `${deleting.courseName} and its batches will be removed. Courses with enrolled students cannot be deleted — mark them inactive instead.` : ''}
        confirmLabel="Delete"
        destructive
        loading={busy}
        onConfirm={remove}
      />
    </div>
  );
}
