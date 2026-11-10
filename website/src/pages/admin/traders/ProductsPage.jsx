import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Boxes, Download, Eye, EyeOff, Globe, PackagePlus, Pencil, Plus, Search, Star, Trash2, TriangleAlert, Wallet } from 'lucide-react';
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
import { ProductThumb, StockBadge, TradersPageHeader } from '../../../components/traders/TradersKit';
import ProductFormModal from '../../../components/traders/ProductFormModal';
import StockModal from '../../../components/traders/StockModal';
import { PRODUCT_CATEGORIES, categoryLabel } from '../../../constants/traders';
import { downloadCsv, formatINR } from '../../../lib/format';
import { useApi, useDebounced } from '../../../hooks/useApi';
import api, { apiError } from '../../../lib/api';

export default function TradersProductsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [status, setStatus] = useState('');
  const q = useDebounced(query.trim());
  const { data, loading, error, reload } = useApi('/admin/traders/products', { q, category, stock, status });
  const page = useClientPage(data?.items);
  const s = data?.summary;
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [stocking, setStocking] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/traders/products/${deleting.id}`);
      toast.success('Product removed');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => downloadCsv('sanvi-products.csv', [
    { label: 'SKU', value: (p) => p.sku },
    { label: 'Product', value: (p) => p.name },
    { label: 'Category', value: (p) => categoryLabel(p.category) },
    { label: 'Brand', value: (p) => p.brand },
    { label: 'Model', value: (p) => p.model },
    { label: 'Stock', value: (p) => p.stock },
    { label: 'Unit', value: (p) => p.unit },
    { label: 'Cost price', value: (p) => p.costPrice },
    { label: 'Selling price', value: (p) => p.sellingPrice },
    { label: 'MRP', value: (p) => p.mrp ?? '' },
    { label: 'Stock value (cost)', value: (p) => p.stockValue },
    { label: 'On website', value: (p) => (p.showOnWebsite ? 'Yes' : 'No') },
    { label: 'Status', value: (p) => p.status },
  ], data?.items || []);

  return (
    <div className="space-y-3">
      <TradersPageHeader
        title="Products"
        description="Your full catalogue — parts, prices and photos. Products marked “Show on website” appear on the public products page."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => window.open('/products#catalogue', '_blank', 'noopener')}><Globe className="h-4 w-4" />View on website</Button>
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={!data?.items?.length}><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Add product</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label="Products" value={s ? s.products : '—'} icon={Boxes} tone="amber" />
        <KpiCard label="Units in stock" value={s ? s.units : '—'} icon={PackagePlus} tone="orange" />
        <KpiCard label="Stock value (cost)" value={s ? formatINR(s.costValue) : '—'} icon={Wallet} tone="slate" />
        <KpiCard label="Low / out of stock" value={s ? `${s.low} / ${s.out}` : '—'} icon={TriangleAlert} tone="rose" onClick={() => setStock('low')} />
      </div>

      <Card>
        <CardContent className="space-y-3 pt-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Input placeholder="Name, SKU, brand…" iconLeft={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} className="col-span-2 md:col-span-1" />
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {PRODUCT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
            <Select value={stock} onChange={(e) => setStock(e.target.value)}>
              <option value="">Any stock</option>
              <option value="ok">In stock</option>
              <option value="low">Low or out</option>
              <option value="out">Out of stock</option>
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Active & inactive</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>

          <DataState loading={loading && !data} error={error} onRetry={reload} empty={!page.total} emptyTitle="No products yet" emptyDescription="Add parts with photo, price and opening stock." emptyAction={<Button size="sm" variant="outline" onClick={() => setAdding(true)}>Add a product</Button>}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.rows.map((p) => (
                  <TableRow key={p.id} className={p.status === 'inactive' ? 'opacity-60' : undefined}>
                    <TableCell className="min-w-[14rem]">
                      <div className="flex items-center gap-3">
                        <ProductThumb product={p} />
                        <div className="min-w-0">
                          <button type="button" onClick={() => setEditing(p)} className="flex items-center gap-1 text-left font-medium hover:underline">
                            {p.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                            <span className="line-clamp-1">{p.name}</span>
                          </button>
                          <p className="text-xs text-muted-foreground">{p.sku}{p.brand ? ` · ${p.brand}` : ''}{p.model ? ` ${p.model}` : ''}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{categoryLabel(p.category)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right text-muted-foreground">{formatINR(p.costPrice)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold">
                      {formatINR(p.sellingPrice)}
                      {p.sellingPrice > 0 && p.costPrice > 0 && (
                        <p className="text-[11px] font-normal text-emerald-600">+{formatINR(p.sellingPrice - p.costPrice)}</p>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <p className="font-semibold">{p.stock} <span className="text-xs font-normal text-muted-foreground">{p.unit}</span></p>
                      <StockBadge state={p.stockState} />
                    </TableCell>
                    <TableCell>
                      {p.status === 'inactive'
                        ? <StatusBadge status="inactive" />
                        : p.showOnWebsite
                          ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><Eye className="h-3.5 w-3.5" />Listed</span>
                          : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><EyeOff className="h-3.5 w-3.5" />Hidden</span>}
                    </TableCell>
                    <TableCell className="min-w-[7rem]">
                      <RowActions
                        actions={[
                          { icon: PackagePlus, label: 'Update stock', onClick: () => setStocking(p) },
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

      <ProductFormModal open={adding || Boolean(editing)} product={editing} onOpenChange={() => { setAdding(false); setEditing(null); }} onSaved={reload} />
      <StockModal product={stocking} onOpenChange={() => setStocking(null)} onSaved={reload} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={() => setDeleting(null)}
        title="Delete product?"
        description={deleting ? `${deleting.name} will be removed from the catalogue and the website. Old bills keep their lines.` : ''}
        confirmLabel="Delete product"
        destructive
        loading={busy}
        onConfirm={remove}
      />
    </div>
  );
}
