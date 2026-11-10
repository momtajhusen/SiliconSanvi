import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { IndianRupee, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import Modal from '../../../components/ui/Modal';
import { Skeleton } from '../../../components/ui/Loader';
import { FormBanner } from '../../../components/ui/FormBanner';
import PageHeader from '../../../components/admin/PageHeader';
import StatusBadge from '../../../components/admin/StatusBadge';
import Field, { FormSection } from '../../../components/admin/Field';
import PaymentModal from '../../../components/admin/PaymentModal';
import { feeTotals, previewSchedule } from '../../../components/admin/EnrollmentFields';
import { FEE_COMPONENTS, paymentModeLabel } from '../../../constants/institute';
import { formatDate, formatINR, toInputDate } from '../../../lib/format';
import { useApi } from '../../../hooks/useApi';
import api, { apiError } from '../../../lib/api';

function EditFeeForm({ fee, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    ...Object.fromEntries(FEE_COMPONENTS.map(({ key }) => [key, fee[key] ?? 0])),
    discount: fee.discount ?? 0,
    scholarship: fee.scholarship ?? 0,
    installments: fee.installments || 1,
    firstDueDate: toInputDate(fee.installmentSchedule?.[0]?.dueDate),
    remarks: fee.remarks || '',
  }));
  const [custom, setCustom] = useState(false);
  const [rows, setRows] = useState(() =>
    (fee.installmentSchedule || []).map((r) => ({ title: r.title, amount: r.amount, dueDate: toInputDate(r.dueDate) }))
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const { total, net } = feeTotals(form);
  const rowSum = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const resetRows = () => {
    setRows(
      previewSchedule(net, form.installments, form.firstDueDate).map((r) => ({
        title: Number(form.installments) > 1 ? `Installment ${r.number}` : 'Full payment',
        amount: r.amount,
        dueDate: toInputDate(r.dueDate),
      }))
    );
  };
  const setRow = (index, key, value) => setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)));

  const submit = async () => {
    if (net < 0) return setError('Discount is more than the total fee');
    if (net < fee.totalPaid) return setError(`Net fee cannot be less than the amount already paid (${formatINR(fee.totalPaid)})`);
    if (custom) {
      if (!rows.length) return setError('Add at least one installment');
      if (Math.abs(rowSum - net) > 1) return setError(`Installments add up to ${formatINR(rowSum)} but the net fee is ${formatINR(net)}`);
    }
    setError('');
    setSaving(true);
    const body = {
      ...Object.fromEntries(FEE_COMPONENTS.map(({ key }) => [key, Number(form[key]) || 0])),
      discount: Number(form.discount) || 0,
      scholarship: Number(form.scholarship) || 0,
      remarks: form.remarks,
    };
    if (custom) body.installmentSchedule = rows.map((r) => ({ title: r.title, amount: Number(r.amount) || 0, dueDate: r.dueDate || null }));
    else {
      body.installments = Number(form.installments) || 1;
      if (form.firstDueDate) body.firstDueDate = form.firstDueDate;
    }
    try {
      await api.patch(`/admin/fees/${fee.id}`, body);
      toast.success('Fee structure updated');
      onSaved();
      onClose();
    } catch (err) {
      setError(apiError(err));
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-5">
        {error && <FormBanner tone="error" title="Could not save">{error}</FormBanner>}
        <FormSection title="Amounts">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {FEE_COMPONENTS.map(({ key, label }) => (
              <Field key={key} label={`${label} (₹)`}><Input type="number" min="0" value={form[key]} onChange={set(key)} /></Field>
            ))}
            <Field label="Discount (₹)"><Input type="number" min="0" value={form.discount} onChange={set('discount')} /></Field>
            <Field label="Scholarship (₹)"><Input type="number" min="0" value={form.scholarship} onChange={set('scholarship')} /></Field>
          </div>
          <p className="text-sm">Total {formatINR(total)} · <b>Net {formatINR(net)}</b> · Already paid {formatINR(fee.totalPaid)}</p>
        </FormSection>

        <FormSection title="Installments">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={custom}
              onChange={(e) => {
                setCustom(e.target.checked);
                if (e.target.checked && !rows.length) resetRows();
              }}
            />
            Set amounts and dates manually
          </label>
          {!custom ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Number of installments"><Input type="number" min="1" max="36" value={form.installments} onChange={set('installments')} /></Field>
              <Field label="First due date"><Input type="date" value={form.firstDueDate} onChange={set('firstDueDate')} /></Field>
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((row, index) => (
                <div key={index} className="grid grid-cols-[1fr_7rem_9rem_2rem] items-center gap-2">
                  <Input value={row.title} onChange={(e) => setRow(index, 'title', e.target.value)} className="h-9" />
                  <Input type="number" min="0" value={row.amount} onChange={(e) => setRow(index, 'amount', e.target.value)} className="h-9" />
                  <Input type="date" value={row.dueDate} onChange={(e) => setRow(index, 'dueDate', e.target.value)} className="h-9" />
                  <button type="button" onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))} className="text-muted-foreground hover:text-rose-600" aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setRows((prev) => [...prev, { title: `Installment ${prev.length + 1}`, amount: 0, dueDate: '' }])}>
                    <Plus className="h-3.5 w-3.5" />Add row
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={resetRows}>Split equally</Button>
                </div>
                <span className={`text-xs font-semibold ${Math.abs(rowSum - net) > 1 ? 'text-rose-600' : 'text-muted-foreground'}`}>
                  Sum {formatINR(rowSum)} / {formatINR(net)}
                </span>
              </div>
            </div>
          )}
        </FormSection>
        <Field label="Remarks"><Textarea rows={2} value={form.remarks} onChange={set('remarks')} /></Field>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button size="sm" onClick={submit} loading={saving}>Save</Button>
      </div>
    </>
  );
}

export default function FeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi(`/admin/fees/${id}`);
  const [editing, setEditing] = useState(false);
  const [paying, setPaying] = useState(false);

  if (loading && !data) return <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-72 w-full" /></div>;
  if (error) return <FormBanner tone="error" title="Could not load fee">{error}</FormBanner>;
  if (!data) return null;
  const { fee, payments } = data;
  const student = fee.studentId;
  const paidPct = fee.netFee ? Math.min(100, Math.round((fee.totalPaid / fee.netFee) * 100)) : 100;

  return (
    <div className="space-y-3">
      <PageHeader
        back={{ to: '/finance/fees', label: 'Fee structures' }}
        title={`${student?.name} · ${fee.courseId?.courseName}`}
        description={`${student?.studentId} · ${fee.enrollmentId?.enrollmentNumber || ''}${fee.enrollmentId?.batchId ? ` · ${fee.enrollmentId.batchId.batchName}` : ''}`}
        actions={
          <>
            {fee.balance > 0 && <Button size="sm" onClick={() => setPaying(true)}><IndianRupee className="h-4 w-4" />Collect payment</Button>}
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Edit fee</Button>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/students/${student?.id}`)}>Student profile</Button>
          </>
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Fee breakdown</CardTitle>
            <StatusBadge status={fee.feeStatus} />
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {FEE_COMPONENTS.filter(({ key }) => fee[key]).map(({ key, label }) => (
              <div key={key} className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{formatINR(fee[key])}</span></div>
            ))}
            <div className="flex justify-between border-t pt-2 font-medium"><span>Total</span><span>{formatINR(fee.totalFee)}</span></div>
            {fee.discount > 0 && <div className="flex justify-between text-blue-700 dark:text-blue-300"><span>Discount</span><span>− {formatINR(fee.discount)}</span></div>}
            {fee.scholarship > 0 && <div className="flex justify-between text-blue-700 dark:text-blue-300"><span>Scholarship</span><span>− {formatINR(fee.scholarship)}</span></div>}
            <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Net payable</span><span>{formatINR(fee.netFee)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-semibold">{formatINR(fee.totalPaid)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Balance</span><span className="font-semibold text-amber-600">{formatINR(fee.balance)}</span></div>
            {fee.overdueAmount > 0 && <div className="flex justify-between text-rose-600"><span>Overdue</span><span className="font-semibold">{formatINR(fee.overdueAmount)}</span></div>}
            <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--color-muted))]">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${paidPct}%` }} />
            </div>
            {fee.remarks && <p className="pt-1 text-xs text-muted-foreground">{fee.remarks}</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Installment schedule</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fee.installmentProgress.map((row) => (
                  <TableRow key={row.number}>
                    <TableCell>{row.number}</TableCell>
                    <TableCell>{row.title}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(row.dueDate)}</TableCell>
                    <TableCell className="text-right">{formatINR(row.amount)}</TableCell>
                    <TableCell className="text-right">{formatINR(row.paidAmount)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatINR(row.remaining)}</TableCell>
                    <TableCell><StatusBadge status={row.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Installment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><Link to={`/finance/payments/${p.id}`} className="font-medium text-blue-600 hover:underline">{p.receiptNumber}</Link></TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(p.paymentDate)}</TableCell>
                    <TableCell>{paymentModeLabel(p.paymentMode)}{p.transactionId ? ` · ${p.transactionId}` : ''}</TableCell>
                    <TableCell>{p.installmentNumber ? `#${p.installmentNumber}` : '—'}</TableCell>
                    <TableCell className="text-right font-semibold">{formatINR(p.amount)}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal open={editing} onOpenChange={setEditing} title="Edit fee structure" className="max-w-2xl">
        {editing && <EditFeeForm fee={fee} onClose={() => setEditing(false)} onSaved={reload} />}
      </Modal>
      <PaymentModal
        open={paying}
        onOpenChange={setPaying}
        student={student}
        feeId={fee.id}
        onSaved={(payment) => {
          reload();
          navigate(`/finance/payments/${payment.id}`);
        }}
      />
    </div>
  );
}
