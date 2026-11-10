import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CalendarClock, MessageCircle, Pencil, Phone, Send, Trash2, UserCheck, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import Avatar from '../../../components/ui/Avatar';
import { Skeleton } from '../../../components/ui/Loader';
import { FormBanner } from '../../../components/ui/FormBanner';
import PageHeader from '../../../components/admin/PageHeader';
import StatusBadge from '../../../components/admin/StatusBadge';
import Field from '../../../components/admin/Field';
import Info, { InfoGrid } from '../../../components/admin/Info';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import ConvertInquiryModal from '../../../components/admin/ConvertInquiryModal';
import InquiryFormModal, { detailText } from '../../../components/admin/InquiryForm';
import { ENQUIRY_TYPES } from '../../../constants/institute';
import { businessForEnquiry } from '../../../constants/site';
import {
  daysBetween, formatDate, formatDateTime, formatINR, initials, labelize, whatsappLink, yesNo,
} from '../../../lib/format';
import { cn } from '../../../lib/utils';
import { useApi } from '../../../hooks/useApi';
import api, { apiError } from '../../../lib/api';

const TYPE_LABEL = Object.fromEntries(ENQUIRY_TYPES.map((t) => [t.value, t.label]));
const QUICK_NOTES = ['Called — no answer', 'Will visit the institute', 'Asked for fee details', 'Thinking, call again', 'Not interested now'];

function FollowUpForm({ inquiry, onSaved }) {
  const [note, setNote] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const closed = ['converted', 'closed'].includes(inquiry.status);

  const submit = async (event) => {
    event.preventDefault();
    if (!note.trim()) return toast.error('Write what happened on the call / visit');
    setSaving(true);
    try {
      const { data } = await api.post(`/admin/inquiries/${inquiry.id}/follow-ups`, {
        note, nextFollowUpDate: nextDate || null, status: status || undefined,
      });
      toast.success('Follow-up saved');
      setNote('');
      setNextDate('');
      setStatus('');
      onSaved(data.inquiry);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2.5 rounded-xl border border-[hsl(var(--color-border-premium))] bg-[hsl(var(--color-muted))]/30 p-3">
      <div className="flex flex-wrap gap-1.5">
        {QUICK_NOTES.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => setNote(text)}
            className="rounded-full border border-[hsl(var(--color-border-premium))] bg-[hsl(var(--color-card-bg))] px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            {text}
          </button>
        ))}
      </div>
      <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened on this call / visit?" className="min-h-0" />
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Next follow-up"><Input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} /></Field>
        <Field label="Status after this">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} disabled={inquiry.status === 'converted'}>
            <option value="">{inquiry.status === 'new' ? 'In process' : 'Keep as is'}</option>
            <option value="in-process">In process</option>
            {!closed && <option value="closed">Close inquiry</option>}
            {inquiry.status === 'closed' && <option value="new">Reopen</option>}
          </Select>
        </Field>
        <Button type="submit" size="sm" loading={saving} className="h-10"><Send className="h-4 w-4" />Save</Button>
      </div>
    </form>
  );
}

export default function InquiryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi(`/admin/inquiries/${id}`);
  const [override, setOverride] = useState(null);
  const [editing, setEditing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading && !data) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-72 w-full" /></div>;
  if (error) return <FormBanner tone="error" title="Could not load inquiry">{error}</FormBanner>;
  if (!data) return null;
  const inquiry = override?.id === data.inquiry.id ? override : data.inquiry;
  const isCourse = inquiry.enquiryType === 'course';
  const open = ['new', 'in-process'].includes(inquiry.status);
  const followUps = [...(inquiry.followUps || [])].reverse();
  const dueIn = inquiry.followUpDate ? daysBetween(new Date(), inquiry.followUpDate) : null;
  const refresh = () => {
    setOverride(null);
    reload();
  };

  const setStatus = async (status) => {
    try {
      const { data: res } = await api.patch(`/admin/inquiries/${inquiry.id}`, { status });
      toast.success(status === 'closed' ? 'Inquiry closed' : 'Inquiry reopened');
      setOverride({ ...inquiry, ...res.inquiry, courseId: inquiry.courseId, followUps: inquiry.followUps, handledBy: inquiry.handledBy, convertedToStudentId: inquiry.convertedToStudentId });
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/inquiries/${inquiry.id}`);
      toast.success('Inquiry deleted');
      navigate('/admissions/inquiries');
    } catch (err) {
      toast.error(apiError(err));
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        back={{ to: inquiry.webForm === 'online-admission' ? '/admissions/online' : '/admissions/inquiries', label: inquiry.webForm === 'online-admission' ? 'Online admission' : 'Inquiries' }}
        title={inquiry.name}
        description={`${inquiry.inquiryNumber} · ${TYPE_LABEL[inquiry.enquiryType]} enquiry · received ${formatDateTime(inquiry.createdAt)}`}
        actions={
          <>
            {isCourse && open && <Button size="sm" onClick={() => setConverting(true)}><UserCheck className="h-4 w-4" />Admit as student</Button>}
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Edit</Button>
            {open && <Button size="sm" variant="outline" onClick={() => setStatus('closed')}><XCircle className="h-4 w-4" />Close</Button>}
            {inquiry.status === 'closed' && <Button size="sm" variant="outline" onClick={() => setStatus('new')}>Reopen</Button>}
            <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDeleting(true)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
          </>
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-1">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <Avatar fallback={initials(inquiry.name)} className="h-14 w-14 text-base" />
                <div className="min-w-0">
                  <p className="font-semibold">{inquiry.name}</p>
                  <p className="text-sm text-muted-foreground">{inquiry.phone}</p>
                  {inquiry.email && <a href={`mailto:${inquiry.email}`} className="block truncate text-xs text-blue-600 hover:underline">{inquiry.email}</a>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <StatusBadge status={inquiry.status} />
                <StatusBadge status={inquiry.priority} label={`${labelize(inquiry.priority)} lead`} />
                <StatusBadge status="pending" label={labelize(inquiry.leadSource)} />
                {inquiry.webForm && <StatusBadge status="new" label={inquiry.webForm === 'online-admission' ? 'Online admission' : 'Website contact'} />}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => window.open(`tel:${inquiry.phone}`)}><Phone className="h-4 w-4" />Call</Button>
                <Button size="sm" variant="outline" onClick={() => window.open(whatsappLink(inquiry.phone, `Namaste ${inquiry.name}, ${businessForEnquiry(inquiry.enquiryType).name} se baat kar rahe hain.`), '_blank', 'noopener')}>
                  <MessageCircle className="h-4 w-4" />WhatsApp
                </Button>
              </div>
              {inquiry.followUpDate && open && (
                <div className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                  dueIn < 0 ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300' : dueIn === 0 ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                )}>
                  <CalendarClock className="h-4 w-4 shrink-0" />
                  <span>
                    Next follow-up <b>{formatDate(inquiry.followUpDate)}</b>
                    {dueIn < 0 ? ` · ${-dueIn} day${dueIn === -1 ? '' : 's'} late` : dueIn === 0 ? ' · today' : ` · in ${dueIn} day${dueIn === 1 ? '' : 's'}`}
                  </span>
                </div>
              )}
              {inquiry.convertedToStudentId && (
                <Link to={`/students/${inquiry.convertedToStudentId.id}`} className="block rounded-lg bg-blue-900/5 px-3 py-2 text-sm font-medium text-blue-800 hover:underline dark:text-blue-200">
                  Admitted as {inquiry.convertedToStudentId.name} ({inquiry.convertedToStudentId.studentId}) on {formatDate(inquiry.convertedDate)} →
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Interest</CardTitle></CardHeader>
            <CardContent>
              <InfoGrid className="sm:grid-cols-2">
                <Info label="Enquiry for" value={TYPE_LABEL[inquiry.enquiryType]} />
                {isCourse ? (
                  <>
                    <Info label="Course" value={inquiry.courseId?.courseName} />
                    {inquiry.courseId && <Info label="Course fee" value={`${formatINR(inquiry.courseId.baseFee)} · ${inquiry.courseId.durationMonths} mo`} />}
                    <Info label="Preferred batch" value={inquiry.preferredBatch} />
                    <Info label="Other interest" value={inquiry.courseInterest} className="col-span-2" />
                  </>
                ) : (
                  <Info label="Requirement" value={inquiry.courseInterest || detailText(inquiry.details)} className="col-span-2" />
                )}
                {inquiry.details && isCourse && <Info label="Form details" value={detailText(inquiry.details)} className="col-span-2" />}
              </InfoGrid>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3 lg:col-span-2">
          {isCourse && (
            <Card>
              <CardHeader><CardTitle>Student details</CardTitle></CardHeader>
              <CardContent>
                <InfoGrid>
                  <Info label="Gender" value={inquiry.gender && labelize(inquiry.gender)} />
                  <Info label="Age" value={inquiry.age} />
                  <Info label="Date of birth" value={inquiry.dob && formatDate(inquiry.dob)} />
                  <Info label="Qualification" value={inquiry.qualification} />
                  <Info label="School / College" value={inquiry.schoolName} />
                  <Info label="Father's name" value={inquiry.fatherName} />
                  <Info label="Parent mobile" value={inquiry.parentMobile} />
                  <Info label="Computer at home" value={yesNo(inquiry.computerAtHome)} />
                  <Info label="Learned a course before" value={yesNo(inquiry.previousCourse)} />
                  <Info label="Address" value={inquiry.address} className="col-span-2 sm:col-span-3" />
                </InfoGrid>
              </CardContent>
            </Card>
          )}
          {!isCourse && inquiry.address && (
            <Card><CardContent className="pt-4"><Info label="Address" value={inquiry.address} /></CardContent></Card>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Follow-up history</CardTitle>
              <span className="text-xs text-muted-foreground">{followUps.length} note{followUps.length === 1 ? '' : 's'}</span>
            </CardHeader>
            <CardContent className="space-y-4">
              {inquiry.status !== 'converted' && <FollowUpForm inquiry={inquiry} onSaved={setOverride} />}
              <ol className="relative space-y-4 border-l border-[hsl(var(--color-border-premium))] pl-5">
                {followUps.map((row) => (
                  <li key={row.id || row._id} className="relative">
                    <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-[hsl(var(--color-card-bg))] bg-blue-600" />
                    <p className="text-sm">{row.note}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatDateTime(row.at)}{row.by?.name ? ` · ${row.by.name}` : ''}
                      {row.nextFollowUpDate ? ` · next on ${formatDate(row.nextFollowUpDate)}` : ''}
                      {row.statusAfter ? ` · ${labelize(row.statusAfter)}` : ''}
                    </p>
                  </li>
                ))}
                {inquiry.remarks && (
                  <li className="relative">
                    <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-[hsl(var(--color-card-bg))] bg-slate-400" />
                    <p className="text-sm">{inquiry.remarks}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Remarks</p>
                  </li>
                )}
                <li className="relative">
                  <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-[hsl(var(--color-card-bg))] bg-slate-400" />
                  <p className="text-sm">
                    Inquiry received {inquiry.webForm ? 'from the website' : `(${labelize(inquiry.leadSource)})`}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatDateTime(inquiry.createdAt)}{inquiry.handledBy?.name ? ` · ${inquiry.handledBy.name}` : ''}
                  </p>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      <InquiryFormModal open={editing} inquiry={inquiry} onOpenChange={setEditing} onSaved={refresh} />
      <ConvertInquiryModal
        inquiry={converting ? inquiry : null}
        onOpenChange={() => setConverting(false)}
        onSaved={refresh}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete inquiry?"
        description={`${inquiry.inquiryNumber} · ${inquiry.name} will be removed.`}
        confirmLabel="Delete"
        destructive
        loading={busy}
        onConfirm={remove}
      />
    </div>
  );
}
