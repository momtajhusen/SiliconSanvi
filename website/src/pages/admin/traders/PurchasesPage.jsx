import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Boxes, Download, FileText, HandCoins, IndianRupee, Pencil, Plus, Search, ShoppingCart, Trash2, Wallet } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import KpiCard from '../../../components/ui/KpiCard';
import Pagination, { useClientPage } from '../../../components/ui/Pagination';
import DataState from '../../../components/admin/DataState';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import RowActions from '../../../components/admin/RowActions';
import StatusBadge from '../../../components/admin/StatusBadge';
import { TradersPageHeader } from '../../../components/traders/TradersKit';
import SupplierPaymentModal from '../../../components/traders/SupplierPaymentModal';
import { PeriodPicker } from '../../../components/traders/PeriodPicker';
import { downloadCsv, formatDate, formatINR } from '../../../lib/format';
import { useApi, useDebounced } from '../../../hooks/useApi';
import api, { apiError } from '../../../lib/api';

export default function TradersPurchasesPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState('');
  const [supplierId, setSupplierId] = useState(params.get('supplier') || '');
  const [productId, setProductId] = useState(params.get('product') || '');
  const [paymentStatus, setPaymentStatus] = useState(params.get('due') ? 'due' : '');
  const [period, setPeriod] = useState({ from: '', to: '' });
  const q = useDebounced(query.trim());
  const suppliers = useApi('/admin/traders/suppliers');
  const products = useApi('/admin/traders/products');
  const { data, loading, error, reload } = useApi('/admin/traders/purchases', { q, supplierId, productId, paymentStatus, from: period.from, to: period.to });
  const page = useClientPage(data?.items);
  const s = data?.summary;
  const [paying, setPaying] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/traders/purchases/${deleting.id}`);
      toast.success('Purchase deleted and its stock removed');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => downloadCsv('sanvi-purchases.csv', [
    { label: 'Purchase', value: (p) => p.purchaseNumber },
    { label: 'Date', value: (p) => formatDate(p.purchaseDate) },
    { label: 'Supplier', value: (p) => p.supplierId?.name },
    { label: 'Supplier invoice', value: (p) => p.supplierInvoice },
    { label: 'Items', value: (p) => p.items.map((i) => `${i.name} x${i.quantity} @${i.unitCost}`).join('; ') },
    { label: 'Goods value', value: (p) => p.itemsTotal },
    { label: 'Freight', value: (p) => p.freight },
    { label: 'GST', value: (p) => p.taxAmount },
    { label: 'Discount', value: (p) => p.discount },
    { label: 'Bill total', value: (p) => p.total },
    { label: 'Paid', value: (p) => p.paid },
    { label: 'Owed', value: (p) => p.balance },
  ], data?.items || []);

  return (
    <div className="space-y-3">
      <TradersPageHeader
        title="Purchases"
        description="Every supplier bill: what came into stock, at what rate, and what you have paid or still owe."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={!data?.items?.length}><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" onClick={() => navigate('/traders/purchases/new')}><Plus className="h-4 w-4" />Record purchase</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label={`Purchased · ${s?.count ?? 0} bills`} value={s ? formatINR(s.total) : '—'} icon={ShoppingCart} tone="amber" />
        <KpiCard label="Units received" value={s ? s.units : '—'} icon={Boxes} tone="slate" />
        <KpiCard label="Paid to suppliers" value={s ? formatINR(s.paid) : '—'} icon={Wallet} tone="emerald" />
        <KpiCard label="Still owed" value={s ? formatINR(s.balance) : '—'} icon={IndianRupee} tone="rose" onClick={() => setPaymentStatus('due')} />
      </div>

      <Card>
        <CardContent className="space-y-3 pt-3">
          <PeriodPicker value={period} onChange={setPeriod} />
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Input placeholder="Purchase no., invoice, item…" iconLeft={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} className="col-span-2 md:col-span-1" />
            <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">All suppliers</option>
              {(suppliers.data?.items || []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </Select>
            <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">All products</option>
              {(products.data?.items || []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </Select>
            <Select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
              <option value="">Any payment</option>
              <option value="due">Still owed</option>
              <option value="paid">Fully paid</option>
            </Select>
          </div>

          <DataState loading={loading && !data} error={error} onRetry={reload} empty={!page.total} emptyTitle="No purchases found" emptyDescription="Record a supplier bill when goods come in; stock goes up automatically." emptyAction={<Button size="sm" variant="outline" onClick={() => navigate('/traders/purchases/new')}>Record purchase</Button>}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Goods</TableHead>
                  <TableHead className="text-right">Bill</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Owed</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap">
                      <Link to={`/traders/purchases/${p.id}`} className="font-medium text-amber-700 hover:underline dark:text-amber-300">{p.purchaseNumber}</Link>
                      <p className="text-xs text-muted-foreground">{formatDate(p.purchaseDate)}{p.supplierInvoice ? ` · inv. ${p.supplierInvoice}` : ''}</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm font-medium">{p.supplierId?.name || '—'}</TableCell>
                    <TableCell className="max-w-[16rem]">
                      <p className="line-clamp-2 text-xs text-muted-foreground">{p.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold">{formatINR(p.total)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right text-emerald-600">{formatINR(p.paid)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {p.balance > 0 ? <span className="font-semibold text-rose-600">{formatINR(p.balance)}</span> : <StatusBadge status="paid" />}
                    </TableCell>
                    <TableCell className="min-w-[9rem]">
                      <RowActions
                        actions={[
                          p.balance > 0 && { icon: HandCoins, label: 'Pay supplier', onClick: () => setPaying(p) },
                          { icon: FileText, label: 'View', onClick: () => navigate(`/traders/purchases/${p.id}`) },
                          { icon: Pencil, label: 'Edit', onClick: () => navigate(`/traders/purchases/${p.id}/edit`) },
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

      <SupplierPaymentModal purchase={paying} onOpenChange={() => setPaying(null)} onSaved={reload} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={() => setDeleting(null)}
        title="Delete purchase?"
        description={deleting ? `${deleting.purchaseNumber} from ${deleting.supplierId?.name} will be deleted and its goods taken out of stock. Not possible if the goods are already sold or payments are recorded.` : ''}
        confirmLabel="Delete purchase"
        destructive
        loading={busy}
        onConfirm={remove}
      />
    </div>
  );
}
