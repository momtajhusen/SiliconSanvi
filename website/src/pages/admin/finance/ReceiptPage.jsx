import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Paperclip, Pencil, Printer } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Loader';
import { FormBanner } from '../../../components/ui/FormBanner';
import PageHeader from '../../../components/admin/PageHeader';
import EditPaymentModal from '../../../components/admin/EditPaymentModal';
import { mediaUrl } from '../../../lib/api';
import BrandLogo from '../../../components/brand/BrandLogo';
import { BUSINESSES } from '../../../constants/site';
import { formatDate, formatINR, formatTiming, labelize } from '../../../lib/format';
import { useApi } from '../../../hooks/useApi';
import { paymentModeLabel } from '../../../constants/institute';

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n) {
  return n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`;
}

function threeDigits(n) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ONES[h]} Hundred` : '', rest ? twoDigits(rest) : ''].filter(Boolean).join(' ');
}

/** Indian numbering: crore, lakh, thousand. */
function rupeesInWords(amount) {
  let n = Math.floor(Number(amount) || 0);
  const paise = Math.round(((Number(amount) || 0) - n) * 100);
  if (n === 0 && !paise) return 'Zero Rupees Only';
  const parts = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (n) parts.push(threeDigits(n));
  return `${parts.join(' ')} Rupees${paise ? ` and ${twoDigits(paise)} Paise` : ''} Only`;
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium">{value || '—'}</span>
    </div>
  );
}

export default function ReceiptPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useApi(`/admin/payments/${id}`);
  const [editing, setEditing] = useState(false);

  if (loading && !data) return <Skeleton className="mx-auto h-[32rem] w-full max-w-2xl" />;
  if (error) return <FormBanner tone="error" title="Could not load receipt">{error}</FormBanner>;
  if (!data) return null;
  const { payment, fee } = data;
  const student = payment.studentId;
  const enrollment = payment.enrollmentId;
  const total = payment.amount + (payment.lateFee || 0);

  return (
    <div className="space-y-3">
      <div className="no-print">
        <PageHeader
          back={{ to: '/finance/payments', label: 'Payments' }}
          title={`Receipt ${payment.receiptNumber}`}
          actions={
            <>
              {payment.proofUrl && (
                <Button size="sm" variant="outline" onClick={() => window.open(mediaUrl(payment.proofUrl), '_blank', 'noopener')}><Paperclip className="h-4 w-4" />Proof</Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Edit</Button>
              <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" />Print</Button>
            </>
          }
        />
        <EditPaymentModal payment={editing ? payment : null} onOpenChange={() => setEditing(false)} onSaved={reload} />
      </div>

      <div className="receipt-sheet mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-lg sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-12 w-12" alt={BUSINESSES.institute.name} />
            <div>
              <p className="text-lg font-extrabold tracking-tight text-blue-950">{BUSINESSES.institute.name}</p>
              <p className="text-xs text-slate-500">{BUSINESSES.institute.address} · {BUSINESSES.institute.phone}</p>
              <p className="text-xs text-slate-500">{BUSINESSES.institute.email}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fee receipt</p>
            <p className="text-base font-bold">{payment.receiptNumber}</p>
            <p className="text-xs text-slate-500">{formatDate(payment.paymentDate)}</p>
          </div>
        </div>

        {payment.status !== 'success' && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-center text-sm font-semibold text-rose-700">Payment status: {labelize(payment.status)}</p>
        )}

        <div className="grid gap-x-8 gap-y-1 py-4 text-sm sm:grid-cols-2">
          <div>
            <Row label="Student" value={student?.name} />
            <Row label="Student ID" value={student?.studentId} />
            <Row label="Father's name" value={student?.fatherName} />
            <Row label="Mobile" value={student?.phone} />
          </div>
          <div>
            <Row label="Course" value={enrollment?.courseId?.courseName} />
            <Row label="Enrollment" value={enrollment?.enrollmentNumber} />
            <Row label="Batch" value={enrollment?.batchId ? `${enrollment.batchId.batchName} (${formatTiming(enrollment.batchId.timingFrom, enrollment.batchId.timingTo)})` : undefined} />
            {payment.receivedFrom && <Row label="Received from" value={payment.receivedFrom} />}
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">Particulars</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="px-3 py-2">
                {payment.paymentFor === 'installment' && payment.installmentNumber
                  ? `${enrollment?.courseId?.courseName || 'Course'} fee — Installment ${payment.installmentNumber}`
                  : `${labelize(payment.paymentFor)}${payment.installmentNumber ? ` — Installment ${payment.installmentNumber}` : ''}`}
              </td>
              <td className="px-3 py-2 text-right">{formatINR(payment.amount)}</td>
            </tr>
            {payment.lateFee > 0 && (
              <tr className="border-b border-slate-100">
                <td className="px-3 py-2">Late fee</td>
                <td className="px-3 py-2 text-right">{formatINR(payment.lateFee)}</td>
              </tr>
            )}
            <tr className="font-bold">
              <td className="px-3 py-2">Total received</td>
              <td className="px-3 py-2 text-right text-base">{formatINR(total)}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2 text-xs italic text-slate-600">In words: {rupeesInWords(total)}</p>

        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3">
            <Row label="Payment mode" value={paymentModeLabel(payment.paymentMode)} />
            {payment.transactionId && <Row label="Txn / Cheque no." value={payment.transactionId} />}
            <Row label="Collected by" value={payment.collectedBy?.name} />
          </div>
          {fee && (
            <div className="rounded-lg bg-slate-50 p-3">
              <Row label="Net course fee" value={formatINR(fee.netFee)} />
              <Row label="Total paid till date" value={formatINR(fee.totalPaid)} />
              <Row label="Balance" value={formatINR(fee.balance)} />
              {fee.nextDueDate && <Row label="Next due" value={`${formatINR(fee.nextDueAmount)} on ${formatDate(fee.nextDueDate)}`} />}
            </div>
          )}
        </div>

        {payment.remarks && <p className="mt-3 text-xs text-slate-500">Remarks: {payment.remarks}</p>}

        <div className="mt-10 flex items-end justify-between text-xs text-slate-500">
          <p>Fees once paid are not refundable.<br />This is a computer generated receipt.</p>
          <div className="text-center">
            <div className="mb-1 h-px w-40 bg-slate-300" />
            Authorised signatory
          </div>
        </div>
      </div>
    </div>
  );
}
