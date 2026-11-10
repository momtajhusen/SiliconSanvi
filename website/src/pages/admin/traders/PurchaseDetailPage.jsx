import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ExternalLink, HandCoins, Pencil, Printer, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Loader';
import { FormBanner } from '../../../components/ui/FormBanner';
import StatusBadge from '../../../components/admin/StatusBadge';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import { TradersPageHeader } from '../../../components/traders/TradersKit';
import SupplierPaymentModal from '../../../components/traders/SupplierPaymentModal';
import { BrandTile } from '../../../components/marketing/BrandWordmark';
import { BUSINESSES } from '../../../constants/site';
import { cn } from '../../../lib/utils';
import { formatDate, formatINR } from '../../../lib/format';
import { useApi } from '../../../hooks/useApi';
import api, { apiError, mediaUrl } from '../../../lib/api';
import { paymentModeLabel } from '../../../constants/institute';


function Row({ label, value, strong, tone }) {
  return (
    <div className={cn('flex justify-between gap-4 py-1', strong && 'border-t border-slate-200 pt-2 text-base font-bold')}>
      <span className={strong ? '' : 'text-slate-500'}>{label}</span>
      <span className={cn('text-right font-medium', tone)}>{value}</span>
    </div>
  );
}

function PurchaseSheet({ purchase }) {
  const info = BUSINESSES.traders;
  const supplier = purchase.supplierId || {};
  return (
    <div className="receipt-sheet mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-lg">
      <div className="h-1.5 bg-gradient-to-r from-stone-500 via-amber-600 to-stone-500" />
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <BrandTile business="traders" size="md" />
            <div>
              <p className="text-lg font-extrabold tracking-tight text-stone-900">{info.name}</p>
              <p className="text-xs text-slate-500">{info.address} · {info.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Purchase / goods received</p>
            <p className="text-base font-bold">{purchase.purchaseNumber}</p>
            <p className="text-xs text-slate-500">{formatDate(purchase.purchaseDate)}</p>
          </div>
        </div>

        <div className="grid gap-x-8 gap-y-3 py-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Supplier</p>
            <p className="font-semibold">{supplier.name}</p>
            {supplier.address && <p className="text-slate-600">{supplier.address}</p>}
            {supplier.phone && <p className="text-slate-600">{supplier.phone}{supplier.contactPerson ? ` · ${supplier.contactPerson}` : ''}</p>}
            {supplier.gstin && <p className="text-slate-600">GSTIN: {supplier.gstin}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Supplier invoice</p>
            <p className="font-semibold">{purchase.supplierInvoice || '—'}</p>
            {purchase.createdBy?.name && <p className="text-slate-600">Entered by {purchase.createdBy.name}</p>}
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-slate-200 bg-stone-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Rate</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {purchase.items.map((item, index) => (
              <tr key={`${item.productId}-${index}`} className="border-b border-slate-100">
                <td className="px-3 py-2 text-slate-400">{index + 1}</td>
                <td className="px-3 py-2">{item.name}{item.sku && <span className="block text-[11px] text-slate-400">{item.sku}</span>}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">{item.quantity} {item.unit}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">{formatINR(item.unitCost)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">{formatINR(item.quantity * item.unitCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
          <div className="order-2 sm:order-1">
            {purchase.payments.length > 0 && (
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Paid to supplier</p>
                {purchase.payments.map((p) => (
                  <Row key={p.id} label={`${formatDate(p.date)} · ${paymentModeLabel(p.mode)}${p.reference ? ` · ${p.reference}` : ''}`} value={formatINR(p.amount)} />
                ))}
              </div>
            )}
          </div>
          <div className="order-1 sm:order-2">
            <Row label="Goods value" value={formatINR(purchase.itemsTotal)} />
            {purchase.freight > 0 && <Row label="Freight" value={formatINR(purchase.freight)} />}
            {purchase.taxAmount > 0 && <Row label="GST" value={formatINR(purchase.taxAmount)} />}
            {purchase.discount > 0 && <Row label="Discount" value={`− ${formatINR(purchase.discount)}`} />}
            <Row label="Bill total" value={formatINR(purchase.total)} strong />
            <Row label="Paid" value={formatINR(purchase.paid)} tone="text-emerald-700" />
            <Row label="Still owed" value={formatINR(purchase.balance)} tone={purchase.balance > 0 ? 'text-rose-700 font-bold' : ''} />
          </div>
        </div>
        {purchase.notes && <p className="mt-3 whitespace-pre-line rounded-lg border border-stone-100 bg-stone-50 p-3 text-xs text-slate-600">{purchase.notes}</p>}
        <p className="mt-8 text-xs text-slate-400">Internal stock record of {info.name}.</p>
      </div>
    </div>
  );
}

export default function TradersPurchaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi(`/admin/traders/purchases/${id}`);
  const [paying, setPaying] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const purchase = data?.purchase;

  useEffect(() => {
    if (!purchase) return undefined;
    const previous = document.title;
    document.title = `${purchase.purchaseNumber} - ${BUSINESSES.traders.name}`;
    return () => { document.title = previous; };
  }, [purchase]);

  const run = async (fn, done) => {
    setBusy(true);
    try {
      await fn();
      done();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };
  const removePayment = () => run(() => api.delete(`/admin/traders/purchases/${purchase.id}/payments/${removing.id}`), () => { toast.success('Payment removed'); setRemoving(null); reload(); });
  const removePurchase = () => run(() => api.delete(`/admin/traders/purchases/${purchase.id}`), () => { toast.success('Purchase deleted and its stock removed'); navigate('/traders/purchases'); });

  if (loading && !data) return <Skeleton className="mx-auto h-[36rem] w-full max-w-3xl" />;
  if (error) return <FormBanner tone="error" title="Could not load purchase">{error}</FormBanner>;
  if (!purchase) return null;

  return (
    <div className="space-y-3">
      <div className="no-print">
        <TradersPageHeader
          back={{ to: '/traders/purchases', label: 'Purchases' }}
          title={`Purchase ${purchase.purchaseNumber}`}
          actions={
            <>
              {purchase.balance > 0 && <Button size="sm" variant="outline" onClick={() => setPaying(true)}><HandCoins className="h-4 w-4" />Pay supplier</Button>}
              <Link to={`/traders/purchases/${purchase.id}/edit`}><Button size="sm" variant="outline"><Pencil className="h-4 w-4" />Edit</Button></Link>
              <Button size="sm" variant="outline" className="text-rose-600" onClick={() => setDeleting(true)}><Trash2 className="h-4 w-4" />Delete</Button>
              <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" />Print / Save PDF</Button>
            </>
          }
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <PurchaseSheet purchase={purchase} />
        <div className="no-print space-y-3">
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-base">Status</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <StatusBadge status={purchase.paymentStatus} />
              {purchase.attachment && (
                <a href={mediaUrl(purchase.attachment)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-medium text-amber-700 hover:underline dark:text-amber-300">
                  <ExternalLink className="h-4 w-4" />Supplier bill copy
                </a>
              )}
              <p className="text-xs text-muted-foreground">{purchase.items.reduce((t, i) => t + i.quantity, 0)} units added to stock on {formatDate(purchase.purchaseDate)}.</p>
            </CardContent>
          </Card>
          {purchase.payments.length > 0 && (
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-base">Supplier payments</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {purchase.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-[hsl(var(--color-muted))] px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold">{formatINR(p.amount)} <span className="text-xs font-normal text-muted-foreground">{paymentModeLabel(p.mode)}</span></p>
                      <p className="truncate text-[11px] text-muted-foreground">{formatDate(p.date)}{p.paidBy?.name ? ` · ${p.paidBy.name}` : ''}{p.note ? ` · ${p.note}` : ''}</p>
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

      <SupplierPaymentModal purchase={paying ? purchase : null} onOpenChange={() => setPaying(false)} onSaved={reload} />
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={() => setRemoving(null)}
        title="Remove payment?"
        description={removing ? `${formatINR(removing.amount)} paid on ${formatDate(removing.date)} will be removed and the amount owed goes up.` : ''}
        confirmLabel="Remove payment"
        destructive
        loading={busy}
        onConfirm={removePayment}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={() => setDeleting(false)}
        title="Delete purchase?"
        description={`${purchase.purchaseNumber} will be deleted and its goods taken out of stock. Not possible if the goods are already sold or payments are recorded.`}
        confirmLabel="Delete purchase"
        destructive
        loading={busy}
        onConfirm={removePurchase}
      />
    </div>
  );
}
