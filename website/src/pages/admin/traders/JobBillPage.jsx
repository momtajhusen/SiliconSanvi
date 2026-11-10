import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { HandCoins, MessageCircle, Pencil, Printer, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Loader';
import { FormBanner } from '../../../components/ui/FormBanner';
import StatusBadge from '../../../components/admin/StatusBadge';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import { TradersPageHeader } from '../../../components/traders/TradersKit';
import JobPaymentModal from '../../../components/traders/JobPaymentModal';
import { BrandTile } from '../../../components/marketing/BrandWordmark';
import { BUSINESSES } from '../../../constants/site';
import { rupeesInWords } from '../../../lib/words';
import { cn } from '../../../lib/utils';
import { formatDate, formatINR, labelize, whatsappLink } from '../../../lib/format';
import { useApi } from '../../../hooks/useApi';
import api, { apiError } from '../../../lib/api';
import { paymentModeLabel } from '../../../constants/institute';


function Row({ label, value, strong, tone }) {
  return (
    <div className={cn('flex justify-between gap-4 py-1', strong && 'border-t border-slate-200 pt-2 text-base font-bold')}>
      <span className={strong ? '' : 'text-slate-500'}>{label}</span>
      <span className={cn('text-right font-medium', tone)}>{value}</span>
    </div>
  );
}

function BillSheet({ job }) {
  const info = BUSINESSES.traders;
  const taxable = job.itemsTotal + job.labourCharge - job.discount;
  return (
    <div className="receipt-sheet mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-lg">
      <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600" />
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <BrandTile business="traders" size="md" />
            <div>
              <p className="text-lg font-extrabold tracking-tight text-stone-900">{info.name}</p>
              <p className="text-xs text-slate-500">{info.address} · {info.phone}</p>
              <p className="text-xs text-slate-500">{info.email}{info.registration ? ` · ${info.registration}` : ''}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">{job.taxRate > 0 ? 'Tax invoice' : 'Bill / invoice'}</p>
            <p className="text-base font-bold">{job.billNumber}</p>
            <p className="text-xs text-slate-500">{formatDate(job.jobDate)}</p>
          </div>
        </div>

        {job.status === 'cancelled' && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-center text-sm font-semibold text-rose-700">This bill is cancelled</p>
        )}

        <div className="grid gap-x-8 gap-y-3 py-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Bill to (partner)</p>
            <p className="font-semibold">{job.client?.name}</p>
            {job.client?.address && <p className="text-slate-600">{job.client.address}</p>}
            {job.client?.phone && <p className="text-slate-600">{job.client.phone}</p>}
            {job.client?.gstin && <p className="text-slate-600">GSTIN: {job.client.gstin}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Installation</p>
            <p className="font-semibold">{labelize(job.status)}</p>
            {job.client?.address && <p className="text-slate-600">At {job.client.address}</p>}
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-slate-200 bg-amber-50/60 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Rate</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {job.items.map((item, index) => (
              <tr key={`${item.name}-${index}`} className="border-b border-slate-100">
                <td className="px-3 py-2 text-slate-400">{index + 1}</td>
                <td className="px-3 py-2">{item.name}{item.sku && <span className="block text-[11px] text-slate-400">{item.sku}</span>}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">{item.quantity} {item.unit}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">{formatINR(item.unitPrice)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">{formatINR(item.quantity * item.unitPrice)}</td>
              </tr>
            ))}
            {job.labourCharge > 0 && (
              <tr className="border-b border-slate-100">
                <td className="px-3 py-2 text-slate-400">{job.items.length + 1}</td>
                <td className="px-3 py-2">Installation & service charge</td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2" />
                <td className="whitespace-nowrap px-3 py-2 text-right">{formatINR(job.labourCharge)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
          <div className="order-2 sm:order-1">
            {job.payments.length > 0 && (
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Payments received</p>
                {job.payments.map((p) => (
                  <Row key={p.id} label={`${formatDate(p.date)} · ${paymentModeLabel(p.mode)}${p.reference ? ` · ${p.reference}` : ''}`} value={formatINR(p.amount)} />
                ))}
              </div>
            )}
          </div>
          <div className="order-1 sm:order-2">
            <Row label="Sub-total" value={formatINR(job.itemsTotal + job.labourCharge)} />
            {job.discount > 0 && <Row label="Discount" value={`− ${formatINR(job.discount)}`} />}
            {job.taxRate > 0 && (
              <>
                <Row label="Taxable value" value={formatINR(taxable)} />
                <Row label={`CGST ${job.taxRate / 2}%`} value={formatINR(job.taxAmount / 2)} />
                <Row label={`SGST ${job.taxRate / 2}%`} value={formatINR(job.taxAmount / 2)} />
              </>
            )}
            <Row label="Bill amount" value={formatINR(job.total)} strong />
            <Row label="Received" value={formatINR(job.paid)} tone="text-emerald-700" />
            <Row label="Balance due" value={formatINR(job.balance)} tone={job.balance > 0 ? 'text-rose-700 font-bold' : ''} />
          </div>
        </div>
        <p className="mt-2 text-xs italic text-slate-600">In words: {rupeesInWords(job.total)}</p>
        {job.notes && <p className="mt-3 whitespace-pre-line rounded-lg border border-amber-100 bg-amber-50/50 p-3 text-xs text-slate-600">{job.notes}</p>}

        <div className="mt-10 flex items-end justify-between gap-4 text-xs text-slate-500">
          <p>Thank you for choosing {info.name}.<br />Goods once sold are covered by brand warranty only.<br />This is a computer generated bill.</p>
          <div className="text-center">
            <div className="mb-1 h-px w-40 bg-slate-300" />
            For {info.name}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TradersJobBillPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useApi(`/admin/traders/jobs/${id}`);
  const [paying, setPaying] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const job = data?.job;

  useEffect(() => {
    if (!job) return undefined;
    const previous = document.title;
    document.title = `${job.billNumber} - ${BUSINESSES.traders.name}`;
    return () => { document.title = previous; };
  }, [job]);

  const removePayment = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/traders/jobs/${job.id}/payments/${removing.id}`);
      toast.success('Payment removed');
      setRemoving(null);
      reload();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) return <Skeleton className="mx-auto h-[36rem] w-full max-w-3xl" />;
  if (error) return <FormBanner tone="error" title="Could not load bill">{error}</FormBanner>;
  if (!job) return null;

  const shareText = `${BUSINESSES.traders.name}\nBill ${job.billNumber} · ${formatDate(job.jobDate)}\nAmount: ${formatINR(job.total)}\nReceived: ${formatINR(job.paid)}\nBalance due: ${formatINR(job.balance)}\nThank you!`;
  return (
    <div className="space-y-3">
      <div className="no-print">
        <TradersPageHeader
          back={{ to: job.partnerId ? `/traders/jobs?partner=${job.partnerId.id}` : '/traders/jobs', label: 'Partners & bills' }}
          title={`Bill ${job.billNumber}`}
          actions={
            <>
              {job.balance > 0 && job.status !== 'cancelled' && <Button size="sm" variant="outline" onClick={() => setPaying(true)}><HandCoins className="h-4 w-4" />Receive payment</Button>}
              {job.client?.phone && (
                <Button size="sm" variant="outline" onClick={() => window.open(whatsappLink(job.client.phone, shareText), '_blank', 'noopener')}><MessageCircle className="h-4 w-4" />WhatsApp</Button>
              )}
              <Link to={`/traders/jobs/${job.id}/edit`}><Button size="sm" variant="outline"><Pencil className="h-4 w-4" />Edit</Button></Link>
              <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" />Print / Save PDF</Button>
            </>
          }
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <BillSheet job={job} />
        <div className="no-print space-y-3">
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-base">Status</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              <StatusBadge status={job.status} />
              <StatusBadge status={job.paymentStatus} />
              {job.partnerId && (
                <Link to={`/traders/jobs?partner=${job.partnerId.id}`} className="w-full pt-1 text-xs font-medium text-amber-700 hover:underline dark:text-amber-300">
                  View partner {job.partnerId.name} · all bills & items
                </Link>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-base">Profit (internal)</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <div className="flex justify-between py-1"><span className="text-muted-foreground">Sale excl. GST</span><b>{formatINR(job.total - job.taxAmount)}</b></div>
              <div className="flex justify-between py-1"><span className="text-muted-foreground">Parts cost</span><span>− {formatINR(job.itemsCost)}</span></div>
              <div className="mt-1 flex justify-between border-t border-[hsl(var(--color-border-premium))] pt-2 text-base font-bold">
                <span>Profit</span>
                <span className={job.profit < 0 ? 'text-rose-600' : 'text-emerald-600'}>{formatINR(job.profit)}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Not printed on the bill.</p>
            </CardContent>
          </Card>
          {job.payments.length > 0 && (
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-base">Payments</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {job.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-[hsl(var(--color-muted))] px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold">{formatINR(p.amount)} <span className="text-xs font-normal text-muted-foreground">{paymentModeLabel(p.mode)}</span></p>
                      <p className="truncate text-[11px] text-muted-foreground">{formatDate(p.date)}{p.receivedBy?.name ? ` · ${p.receivedBy.name}` : ''}{p.note ? ` · ${p.note}` : ''}</p>
                    </div>
                    <button type="button" onClick={() => setRemoving(p)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600" aria-label="Remove payment">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <JobPaymentModal job={paying ? job : null} onOpenChange={() => setPaying(false)} onSaved={reload} />
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={() => setRemoving(null)}
        title="Remove payment?"
        description={removing ? `${formatINR(removing.amount)} received on ${formatDate(removing.date)} will be removed and the balance goes up.` : ''}
        confirmLabel="Remove payment"
        destructive
        loading={busy}
        onConfirm={removePayment}
      />
    </div>
  );
}
