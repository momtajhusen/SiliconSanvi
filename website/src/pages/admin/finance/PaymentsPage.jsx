import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CalendarDays, Download, FileText, IndianRupee, Paperclip, Pencil, Plus, Search, Trash2, Wallet } from 'lucide-react';
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
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import RowActions from '../../../components/admin/RowActions';
import PaymentModal from '../../../components/admin/PaymentModal';
import EditPaymentModal from '../../../components/admin/EditPaymentModal';
import PillTabs from '../../../components/admin/PillTabs';
import { PAYMENT_FOR, PAYMENT_MODES, PAYMENT_STATUSES, paymentModeLabel } from '../../../constants/institute';
import { downloadCsv, formatDate, formatINR, labelize, toInputDate } from '../../../lib/format';
import { useApi, useDebounced } from '../../../hooks/useApi';
import api, { apiError, mediaUrl } from '../../../lib/api';


function monthStart() {
  const d = new Date();
  return toInputDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

function presetRange(key) {
  const today = new Date();
  const day = (offset) => toInputDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset));
  switch (key) {
    case 'today': return [day(0), day(0)];
    case 'yesterday': return [day(-1), day(-1)];
    case 'week': return [day(-((today.getDay() + 6) % 7)), ''];
    case 'month': return [monthStart(), ''];
    case 'last_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return [toInputDate(start), toInputDate(end)];
    }
    default: return ['', ''];
  }
}

const PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'all', label: 'All time' },
];

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState('');
  const [mode, setMode] = useState('');
  const [paymentFor, setPaymentFor] = useState('');
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const q = useDebounced(query.trim());
  const { data, loading, error, reload } = useApi('/admin/payments', { from, to, mode, paymentFor, status, q });
  const page = useClientPage(data?.items);
  const summary = data?.summary;
  const [collecting, setCollecting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const activePreset = PRESETS.find((p) => {
    const [f, t] = presetRange(p.value);
    return f === from && t === to;
  })?.value;
  const applyPreset = (key) => {
    const [f, t] = presetRange(key);
    setFrom(f);
    setTo(t);
  };

  const exportCsv = () => downloadCsv(`payments${from ? `-${from}` : ''}${to ? `-to-${to}` : ''}.csv`, [
    { label: 'Receipt', value: (p) => p.receiptNumber },
    { label: 'Date', value: (p) => formatDate(p.paymentDate) },
    { label: 'Student', value: (p) => p.studentId?.name },
    { label: 'Student ID', value: (p) => p.studentId?.studentId },
    { label: 'Course', value: (p) => p.enrollmentId?.courseId?.courseName },
    { label: 'For', value: (p) => `${labelize(p.paymentFor)}${p.installmentNumber ? ` #${p.installmentNumber}` : ''}` },
    { label: 'Mode', value: (p) => paymentModeLabel(p.paymentMode) },
    { label: 'Transaction', value: (p) => p.transactionId },
    { label: 'Amount', value: (p) => p.amount },
    { label: 'Late fee', value: (p) => p.lateFee || 0 },
    { label: 'Total', value: (p) => p.amount + (p.lateFee || 0) },
    { label: 'Status', value: (p) => p.status },
    { label: 'Received from', value: (p) => p.receivedFrom },
    { label: 'Remarks', value: (p) => p.remarks },
  ], data?.items || []);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/payments/${deleting.id}`);
      toast.success('Payment deleted and balance updated');
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
        title="Payments"
        description="Fee collection with receipts. Deleting a payment restores the student's balance."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={!data?.items?.length}><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" onClick={() => setCollecting(true)}><Plus className="h-4 w-4" />Collect payment</Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <KpiCard label="Today" value={summary ? formatINR(summary.today.total) : '—'} icon={IndianRupee} tone="sky" />
        <KpiCard label="This month" value={summary ? formatINR(summary.month.total) : '—'} icon={CalendarDays} tone="blue" />
        <KpiCard label={`Filtered · ${summary?.filtered.count ?? 0} receipts`} value={summary ? formatINR(summary.filtered.total) : '—'} icon={Wallet} tone="slate" />
      </div>

      {summary && Object.keys(summary.byMode).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(summary.byMode).map(([key, total]) => (
            <span key={key} className="rounded-full border border-[hsl(var(--color-border-premium))] bg-[hsl(var(--color-card-bg))] px-3 py-1 text-xs">
              {paymentModeLabel(key)} <b>{formatINR(total)}</b>
            </span>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="space-y-3 pt-3">
          <PillTabs tabs={PRESETS} value={activePreset} onChange={applyPreset} />
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
            <Input placeholder="Student, receipt, txn…" iconLeft={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} className="col-span-2 md:col-span-1" />
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
            <Select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="">All modes</option>
              {PAYMENT_MODES.map((m) => <option key={m} value={m}>{paymentModeLabel(m)}</option>)}
            </Select>
            <Select value={paymentFor} onChange={(e) => setPaymentFor(e.target.value)}>
              <option value="">Any purpose</option>
              {PAYMENT_FOR.map((m) => <option key={m} value={m}>{labelize(m)}</option>)}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Any status</option>
              {PAYMENT_STATUSES.map((m) => <option key={m} value={m}>{labelize(m)}</option>)}
            </Select>
          </div>

          <DataState loading={loading && !data} error={error} onRetry={reload} empty={!page.total} emptyTitle="No payments in this period" emptyAction={<Button size="sm" variant="outline" onClick={() => setCollecting(true)}>Collect a payment</Button>}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>For / Mode</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap">
                      <Link to={`/finance/payments/${p.id}`} className="font-medium text-blue-600 hover:underline">{p.receiptNumber}</Link>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        {formatDate(p.paymentDate)}
                        {p.proofUrl && (
                          <a href={mediaUrl(p.proofUrl)} target="_blank" rel="noopener noreferrer" title="Payment proof" className="text-blue-600"><Paperclip className="h-3 w-3" /></a>
                        )}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-[12rem]">
                      <Link to={`/students/${p.studentId?.id}`} className="font-medium hover:underline">{p.studentId?.name}</Link>
                      <p className="text-xs text-muted-foreground">{p.studentId?.studentId}</p>
                    </TableCell>
                    <TableCell className="max-w-[12rem]">{p.enrollmentId?.courseId?.courseName || '—'}</TableCell>
                    <TableCell>
                      <p>{labelize(p.paymentFor)}{p.installmentNumber ? ` #${p.installmentNumber}` : ''}</p>
                      <p className="text-xs text-muted-foreground">{paymentModeLabel(p.paymentMode)}{p.transactionId ? ` · ${p.transactionId}` : ''}</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold">
                      {formatINR(p.amount + (p.lateFee || 0))}
                      {p.lateFee > 0 && <p className="text-[11px] font-normal text-muted-foreground">incl. late fee {formatINR(p.lateFee)}</p>}
                    </TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell>
                      <RowActions
                        actions={[
                          { icon: FileText, label: 'Receipt', onClick: () => navigate(`/finance/payments/${p.id}`) },
                          { icon: Pencil, label: 'Edit', onClick: () => setEditing(p) },
                          { icon: Trash2, label: 'Delete', tone: 'danger', onClick: () => setDeleting(p) },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page.page} total={page.total} limit={page.limit} onPage={page.setPage} />
          </DataState>
        </CardContent>
      </Card>

      <PaymentModal
        open={collecting}
        onOpenChange={setCollecting}
        onSaved={(payment) => navigate(`/finance/payments/${payment.id}`)}
      />
      <EditPaymentModal payment={editing} onOpenChange={() => setEditing(null)} onSaved={reload} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={() => setDeleting(null)}
        title="Delete payment?"
        description={deleting ? `${deleting.receiptNumber} (${formatINR(deleting.amount)}) will be removed and the student's balance will go up again.` : ''}
        confirmLabel="Delete payment"
        destructive
        loading={busy}
        onConfirm={remove}
      />
    </div>
  );
}
