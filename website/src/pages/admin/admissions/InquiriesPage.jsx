import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CalendarClock, Eye, MessageCircle, Pencil, Phone, Plus, Search, Trash2, UserCheck, XCircle } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Pagination, { useClientPage } from '../../../components/ui/Pagination';
import PageHeader from '../../../components/admin/PageHeader';
import StatusBadge from '../../../components/admin/StatusBadge';
import DataState from '../../../components/admin/DataState';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import RowActions from '../../../components/admin/RowActions';
import ConvertInquiryModal from '../../../components/admin/ConvertInquiryModal';
import InquiryFormModal, { detailText } from '../../../components/admin/InquiryForm';
import { ENQUIRY_TYPES, LEAD_PRIORITIES } from '../../../constants/institute';
import { formatDate, labelize, whatsappLink } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import { useApi, useDebounced } from '../../../hooks/useApi';
import api, { apiError } from '../../../lib/api';

const TABS = [
  { value: 'open', label: 'Open', statuses: ['new', 'in-process'] },
  { value: 'new', label: 'New', statuses: ['new'] },
  { value: 'in-process', label: 'In process', statuses: ['in-process'] },
  { value: 'converted', label: 'Converted', statuses: ['converted'] },
  { value: 'closed', label: 'Closed', statuses: ['closed'] },
  { value: 'all', label: 'All', statuses: ['new', 'in-process', 'converted', 'closed'] },
];

const TYPE_LABEL = Object.fromEntries(ENQUIRY_TYPES.map((t) => [t.value, t.label]));

export default function InquiriesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('open');
  const [type, setType] = useState('');
  const [priority, setPriority] = useState('');
  const [followUpDue, setFollowUpDue] = useState(false);
  const [query, setQuery] = useState('');
  const q = useDebounced(query.trim());
  const status = tab === 'open' ? '' : tab;
  const { data, loading, error, reload } = useApi('/admin/inquiries', {
    status: tab === 'all' ? 'all' : status, enquiryType: type, priority, q, followUp: followUpDue ? 'due' : '',
  });
  const page = useClientPage(data?.items);
  const counts = data?.counts || {};
  const [editing, setEditing] = useState(null);
  const [converting, setConverting] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const closeInquiry = async (inquiry) => {
    try {
      await api.patch(`/admin/inquiries/${inquiry.id}`, { status: 'closed' });
      toast.success('Inquiry closed');
      reload();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/inquiries/${deleting.id}`);
      toast.success('Inquiry deleted');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return (
    <div className="space-y-3">
      <PageHeader
        title="Inquiries"
        description="Walk-in, phone and website enquiries for courses, CCTV and computer parts."
        actions={<Button size="sm" onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Add inquiry</Button>}
      />

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const count = t.statuses.reduce((sum, s) => sum + (counts[s] || 0), 0);
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                tab === t.value
                  ? 'border-blue-700 bg-blue-700 text-white'
                  : 'border-[hsl(var(--color-border-premium))] bg-[hsl(var(--color-card-bg))] text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
              <span className={cn('rounded-full px-1.5 text-[10px]', tab === t.value ? 'bg-white/20' : 'bg-[hsl(var(--color-muted))]')}>{count}</span>
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="space-y-3 pt-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <Input placeholder="Search name, phone, INQ no…" iconLeft={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} className="lg:max-w-xs" />
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:w-40">
                <option value="">All types</option>
                {ENQUIRY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
              <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="sm:w-36">
                <option value="">Any priority</option>
                {LEAD_PRIORITIES.map((p) => <option key={p} value={p}>{labelize(p)}</option>)}
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={followUpDue} onChange={(e) => setFollowUpDue(e.target.checked)} />
              Follow-up due today
            </label>
          </div>

          <DataState loading={loading && !data} error={error} onRetry={reload} empty={!page.total} emptyTitle="No inquiries" emptyDescription="New website enquiries and walk-ins will appear here.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enquirer</TableHead>
                  <TableHead>Interested in</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-44" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.rows.map((inq) => {
                  const due = inq.followUpDate && new Date(inq.followUpDate) <= today && ['new', 'in-process'].includes(inq.status);
                  const canConvert = inq.enquiryType === 'course' && !['converted', 'closed'].includes(inq.status);
                  return (
                    <TableRow key={inq.id}>
                      <TableCell className="max-w-[14rem]">
                        <Link to={`/admissions/inquiries/${inq.id}`} className="font-medium hover:underline">{inq.name}</Link>
                        <a href={`tel:${inq.phone}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                          <Phone className="h-3 w-3" />{inq.phone}
                        </a>
                        <p className="text-[11px] text-muted-foreground">{inq.inquiryNumber} · {formatDate(inq.createdAt)}</p>
                      </TableCell>
                      <TableCell className="max-w-[14rem]">
                        <p className="text-xs font-semibold text-muted-foreground">{TYPE_LABEL[inq.enquiryType]}</p>
                        <p>{inq.courseId?.courseName || inq.courseInterest || detailText(inq.details) || '—'}</p>
                        {inq.preferredBatch && <p className="text-xs text-muted-foreground">{inq.preferredBatch} batch</p>}
                      </TableCell>
                      <TableCell>
                        <p>{labelize(inq.leadSource)}</p>
                        {inq.webForm === 'online-admission' && <p className="text-[11px] font-semibold text-blue-600">Online admission</p>}
                      </TableCell>
                      <TableCell><StatusBadge status={inq.priority} /></TableCell>
                      <TableCell className={cn('whitespace-nowrap', due && 'font-semibold text-rose-600')}>
                        {inq.followUpDate ? (
                          <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />{formatDate(inq.followUpDate)}</span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={inq.status} />
                        {inq.convertedToStudentId && (
                          <Link to={`/students/${inq.convertedToStudentId}`} className="mt-1 block text-[11px] font-medium text-blue-600 hover:underline">View student</Link>
                        )}
                      </TableCell>
                      <TableCell>
                        <RowActions
                          actions={[
                            { icon: Eye, label: 'View details & follow-ups', onClick: () => navigate(`/admissions/inquiries/${inq.id}`) },
                            canConvert && { icon: UserCheck, label: 'Admit as student', onClick: () => setConverting(inq) },
                            { icon: MessageCircle, label: 'WhatsApp', onClick: () => window.open(whatsappLink(inq.phone), '_blank', 'noopener') },
                            { icon: Pencil, label: 'Edit / follow-up', onClick: () => setEditing(inq) },
                            ['new', 'in-process'].includes(inq.status) && { icon: XCircle, label: 'Close inquiry', onClick: () => closeInquiry(inq) },
                            { icon: Trash2, label: 'Delete', tone: 'danger', onClick: () => setDeleting(inq) },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Pagination page={page.page} total={page.total} limit={page.limit} onPage={page.setPage} />
          </DataState>
        </CardContent>
      </Card>

      <InquiryFormModal open={Boolean(editing)} inquiry={editing === 'new' ? null : editing} onOpenChange={() => setEditing(null)} onSaved={reload} />

      <ConvertInquiryModal inquiry={converting} onOpenChange={() => setConverting(null)} onSaved={reload} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={() => setDeleting(null)}
        title="Delete inquiry?"
        description={deleting ? `${deleting.inquiryNumber} · ${deleting.name} will be removed.` : ''}
        confirmLabel="Delete"
        destructive
        loading={busy}
        onConfirm={remove}
      />
    </div>
  );
}
