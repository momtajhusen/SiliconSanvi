import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Boxes, History, PackagePlus, Search, ShoppingCart, TriangleAlert, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import KpiCard from '../../../components/ui/KpiCard';
import Pagination, { useClientPage } from '../../../components/ui/Pagination';
import DataState from '../../../components/admin/DataState';
import PillTabs from '../../../components/admin/PillTabs';
import { ProductThumb, StockBadge, TradersPageHeader } from '../../../components/traders/TradersKit';
import StockModal from '../../../components/traders/StockModal';
import { PeriodPicker } from '../../../components/traders/PeriodPicker';
import { PRODUCT_CATEGORIES, STOCK_MOVE_LABELS, categoryLabel } from '../../../constants/traders';
import { cn } from '../../../lib/utils';
import { formatDate, formatINR } from '../../../lib/format';
import { useApi, useDebounced } from '../../../hooks/useApi';

const VIEWS = [
  { value: 'levels', label: 'Stock levels' },
  { value: 'history', label: 'Stock history' },
];

function StockLevels({ onStock }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const q = useDebounced(query.trim());
  const { data, loading, error, reload } = useApi('/admin/traders/products', { q, category, stock, status: 'active' });
  const page = useClientPage(data?.items);
  const s = data?.summary;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label="Units in stock" value={s ? s.units : '—'} icon={Boxes} tone="amber" />
        <KpiCard label="Value at cost" value={s ? formatINR(s.costValue) : '—'} icon={Wallet} tone="slate" />
        <KpiCard label="Value at selling price" value={s ? formatINR(s.saleValue) : '—'} icon={Wallet} tone="orange" />
        <KpiCard label="Low / out of stock" value={s ? `${s.low} / ${s.out}` : '—'} icon={TriangleAlert} tone="rose" onClick={() => setStock('low')} />
      </div>
      <Card>
        <CardContent className="space-y-3 pt-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            <Input placeholder="Search product…" iconLeft={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} className="col-span-2 md:col-span-1" />
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
          </div>
          <DataState loading={loading && !data} error={error} onRetry={reload} empty={!page.total} emptyTitle="No products match" emptyAction={<Link to="/traders/products"><Button size="sm" variant="outline">Go to products</Button></Link>}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">In stock</TableHead>
                  <TableHead className="text-right">Alert at</TableHead>
                  <TableHead className="text-right">Value (cost)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="min-w-[13rem]">
                      <div className="flex items-center gap-3">
                        <ProductThumb product={p} className="h-9 w-9" />
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.sku}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{categoryLabel(p.category)}</TableCell>
                    <TableCell className={cn('whitespace-nowrap text-right text-base font-bold', p.stockState === 'out' && 'text-rose-600', p.stockState === 'low' && 'text-amber-600')}>
                      {p.stock} <span className="text-xs font-normal text-muted-foreground">{p.unit}</span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{p.reorderLevel}</TableCell>
                    <TableCell className="whitespace-nowrap text-right">{formatINR(p.stockValue)}</TableCell>
                    <TableCell><StockBadge state={p.stockState} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => onStock(p, reload)}><PackagePlus className="h-4 w-4" />Stock</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page.page} total={page.total} limit={page.limit} onPage={page.setPage} />
          </DataState>
        </CardContent>
      </Card>
    </>
  );
}

function StockHistory() {
  const [type, setType] = useState('');
  const [productId, setProductId] = useState('');
  const [period, setPeriod] = useState({ from: '', to: '' });
  const products = useApi('/admin/traders/products');
  const { data, loading, error, reload } = useApi('/admin/traders/stock/moves', { type, productId, from: period.from, to: period.to });
  const page = useClientPage(data?.items);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Every stock change</CardTitle>
        <CardDescription>Purchases, corrections and parts installed on bills. Latest first.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <PeriodPicker value={period} onChange={setPeriod} />
        <div className="grid grid-cols-2 gap-2">
          <Select value={productId} onChange={(e) => setProductId(e.target.value)} aria-label="Product">
            <option value="">All products</option>
            {(products.data?.items || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type of change">
            <option value="">All changes</option>
            {Object.entries(STOCK_MOVE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </div>
        <DataState loading={loading && !data} error={error} onRetry={reload} empty={!page.total} emptyTitle="No stock changes in this period">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Change</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(m.date)}</TableCell>
                  <TableCell className="max-w-[14rem]">
                    <p className="line-clamp-1 font-medium">{m.productId?.name || 'Deleted product'}</p>
                    <p className="text-xs text-muted-foreground">{m.productId?.sku}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{STOCK_MOVE_LABELS[m.type]}</TableCell>
                  <TableCell className={cn('whitespace-nowrap text-right font-bold', m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600')}>
                    <span className="inline-flex items-center gap-0.5">
                      {m.quantity > 0 ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{m.balanceAfter}</TableCell>
                  <TableCell className="max-w-[16rem] text-xs text-muted-foreground">
                    {m.jobId && <Link to={`/traders/jobs/${m.jobId.id}`} className="font-medium text-amber-700 hover:underline dark:text-amber-300">{m.jobId.billNumber} · {m.jobId.client?.name}</Link>}
                    {m.purchaseId && <Link to={`/traders/purchases/${m.purchaseId.id}`} className="font-medium text-amber-700 hover:underline dark:text-amber-300">{m.note}</Link>}
                    {!m.jobId && !m.purchaseId && m.note}
                    {m.unitCost > 0 && m.type.startsWith('purchase') && <span className="block">@ {formatINR(m.unitCost)}</span>}
                    {m.createdBy?.name && <span className="block">by {m.createdBy.name}</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page.page} total={page.total} limit={page.limit} onPage={page.setPage} />
        </DataState>
      </CardContent>
    </Card>
  );
}

export default function TradersStockPage() {
  const [view, setView] = useState('levels');
  const [stocking, setStocking] = useState(null);

  return (
    <div className="space-y-3">
      <TradersPageHeader
        title="Stock"
        description="Live quantity of every part. Purchase bills add stock, installation bills reduce it; editing or deleting either puts it right."
        actions={
          <>
            <Link to="/traders/reports?tab=stock"><Button size="sm" variant="outline"><History className="h-4 w-4" />Stock register</Button></Link>
            <Link to="/traders/purchases/new"><Button size="sm"><ShoppingCart className="h-4 w-4" />Record purchase</Button></Link>
          </>
        }
      />
      <PillTabs tabs={VIEWS} value={view} onChange={setView} />
      {view === 'levels' ? <StockLevels onStock={(product, reload) => setStocking({ product, reload })} /> : <StockHistory />}
      <StockModal product={stocking?.product} onOpenChange={() => setStocking(null)} onSaved={() => stocking?.reload()} />
    </div>
  );
}
