import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import { FormBanner } from '../ui/FormBanner';
import { Skeleton } from '../ui/Loader';
import Field from './Field';
import StudentPicker from './StudentPicker';
import StatusBadge from './StatusBadge';
import ProofUpload from './ProofUpload';
import { PAYMENT_FOR, PAYMENT_MODES, paymentModeLabel } from '../../constants/institute';
import { formatDate, formatINR, labelize, todayInput } from '../../lib/format';
import { useApi } from '../../hooks/useApi';
import api, { apiError } from '../../lib/api';

const OTHER = 'other';

function PaymentForm({ initialStudent, feeId, onClose, onSaved }) {
  const [student, setStudent] = useState(initialStudent || null);
  const [selectedFee, setSelectedFee] = useState(feeId || '');
  const [form, setForm] = useState({
    amount: '',
    lateFee: '',
    paymentMode: 'cash',
    paymentFor: 'other',
    paymentDate: todayInput(),
    transactionId: '',
    receivedFrom: '',
    remarks: '',
    proofUrl: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const preset = useApi(feeId && !student ? `/admin/fees/${feeId}` : null);
  useEffect(() => {
    const s = preset.data?.fee?.studentId;
    if (s && !student) setStudent(s);
  }, [preset.data, student]);

  const feesQuery = useApi(student ? '/admin/fees' : null, { studentId: student?.id });
  const fees = feesQuery.data?.items || [];
  const openFees = fees.filter((fee) => fee.balance > 0 || fee.id === feeId);
  const fee = fees.find((row) => row.id === selectedFee);

  useEffect(() => {
    if (!feesQuery.data) return;
    if (selectedFee && (selectedFee === OTHER || fees.some((row) => row.id === selectedFee))) return;
    setSelectedFee(openFees[0]?.id || OTHER);
  }, [feesQuery.data]);

  useEffect(() => {
    if (fee) setForm((prev) => ({ ...prev, amount: String(fee.nextDueAmount || fee.balance || '') }));
  }, [fee?.id]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const needsReference = !['cash'].includes(form.paymentMode);

  const submit = async () => {
    const amount = Number(form.amount);
    if (!student) return setError('Select a student');
    if (!(amount > 0)) return setError('Enter the amount received');
    if (fee && amount > fee.balance + 0.01) return setError(`Amount is more than the balance (${formatINR(fee.balance)})`);
    setError('');
    setSaving(true);
    try {
      const body = {
        studentId: student.id,
        amount,
        lateFee: Number(form.lateFee) || 0,
        paymentMode: form.paymentMode,
        paymentDate: form.paymentDate,
        transactionId: form.transactionId,
        receivedFrom: form.receivedFrom,
        remarks: form.remarks,
        proofUrl: form.proofUrl || undefined,
      };
      if (fee) body.feeStructureId = fee.id;
      else body.paymentFor = form.paymentFor;
      const { data } = await api.post('/admin/payments', body);
      toast.success(`Payment saved · ${data.payment.receiptNumber}`);
      onSaved?.(data.payment);
      onClose();
    } catch (err) {
      setError(apiError(err));
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {error && <FormBanner tone="error" title="Could not save payment">{error}</FormBanner>}
        <Field label="Student" required>
          {preset.loading ? <Skeleton className="h-12 w-full" /> : (
            <StudentPicker
              value={student}
              onChange={(next) => {
                setStudent(next);
                setSelectedFee('');
              }}
              autoFocus={!initialStudent && !feeId}
            />
          )}
        </Field>

        {student && (
          <Field label="Pay against">
            {feesQuery.loading && !feesQuery.data ? <Skeleton className="h-10 w-full" /> : (
              <Select value={selectedFee} onChange={(event) => setSelectedFee(event.target.value)}>
                {openFees.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.courseId?.courseName || 'Course fee'} · balance {formatINR(row.balance)}
                  </option>
                ))}
                <option value={OTHER}>Other payment (not linked to a course fee)</option>
              </Select>
            )}
          </Field>
        )}

        {fee && (
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-[hsl(var(--color-border-premium))] bg-[hsl(var(--color-muted))]/40 p-3 text-xs sm:grid-cols-4">
            <div><p className="text-muted-foreground">Net fee</p><p className="text-sm font-semibold">{formatINR(fee.netFee)}</p></div>
            <div><p className="text-muted-foreground">Paid</p><p className="text-sm font-semibold">{formatINR(fee.totalPaid)}</p></div>
            <div><p className="text-muted-foreground">Balance</p><p className="text-sm font-semibold text-amber-600">{formatINR(fee.balance)}</p></div>
            <div>
              <p className="text-muted-foreground">Next due</p>
              <p className="text-sm font-semibold">{fee.nextDueDate ? formatDate(fee.nextDueDate) : '—'}</p>
              <StatusBadge status={fee.feeStatus} className="mt-1" />
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Amount (₹)" required>
            <Input type="number" min="0" inputMode="decimal" value={form.amount} onChange={set('amount')} />
          </Field>
          <Field label="Late fee (₹)">
            <Input type="number" min="0" inputMode="decimal" value={form.lateFee} onChange={set('lateFee')} placeholder="0" />
          </Field>
          <Field label="Payment date">
            <Input type="date" value={form.paymentDate} onChange={set('paymentDate')} />
          </Field>
          <Field label="Mode">
            <Select value={form.paymentMode} onChange={set('paymentMode')}>
              {PAYMENT_MODES.map((mode) => <option key={mode} value={mode}>{paymentModeLabel(mode)}</option>)}
            </Select>
          </Field>
          {!fee && (
            <Field label="Payment for">
              <Select value={form.paymentFor} onChange={set('paymentFor')}>
                {PAYMENT_FOR.map((key) => <option key={key} value={key}>{labelize(key)}</option>)}
              </Select>
            </Field>
          )}
          {needsReference && (
            <Field label="Transaction / cheque no.">
              <Input value={form.transactionId} onChange={set('transactionId')} />
            </Field>
          )}
          <Field label="Received from" hint="Leave empty if paid by the student">
            <Input value={form.receivedFrom} onChange={set('receivedFrom')} />
          </Field>
        </div>
        {needsReference && (
          <Field label="Payment proof" hint="Optional · eSewa / Khalti / Fonepay screenshot, cheque photo or bank voucher">
            <ProofUpload value={form.proofUrl} onChange={(proofUrl) => setForm((prev) => ({ ...prev, proofUrl }))} disabled={saving} />
          </Field>
        )}
        <Field label="Remarks">
          <Textarea rows={2} value={form.remarks} onChange={set('remarks')} className="min-h-0" />
        </Field>
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button size="sm" onClick={submit} loading={saving}>Save payment</Button>
      </div>
    </>
  );
}

export default function PaymentModal({ open, onOpenChange, student, feeId, onSaved }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Collect payment" description="Record a fee payment and generate a receipt." className="max-w-2xl">
      {open && (
        <PaymentForm
          key={`${student?.id || ''}-${feeId || ''}`}
          initialStudent={student}
          feeId={feeId}
          onClose={() => onOpenChange(false)}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
}
