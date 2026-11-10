import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Boxes, CalendarClock, IndianRupee, PackagePlus, Plus, ReceiptText, RefreshCw, ShoppingCart, TrendingUp, TriangleAlert, Truck, UserPlus, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import KpiCard from '../../../components/ui/KpiCard';
import { FormBanner } from '../../../components/ui/FormBanner';
import DataState from '../../../components/admin/DataState';
import StatusBadge from '../../../components/admin/StatusBadge';
import { ProductThumb, StockBadge, TradersPageHeader } from '../../../components/traders/TradersKit';
import { formatDate, formatINR } from '../../../lib/format';
import { useApi } from '../../../hooks/useApi';

const ACTIONS = [
  { to: '/traders/jobs/new', label: 'New installation bill', icon: ReceiptText },
  { to: '/traders/products', label: 'Add product', icon: Plus },
  { to: '/traders/purchases/new', label: 'Record purchase', icon: PackagePlus },
  { to: '/traders/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/traders/jobs?add=partner', label: 'Add partner', icon: UserPlus },
  { to: '/traders/reports', label: 'Reports', icon: BarChart3 },
];

export default function TradersOverviewPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi('/admin/traders/overview');
  const k = data?.kpis;
  const show = (value, fmt = (v) => v) => (k ? fmt(value) : '—');

  return (
    <div className="space-y-3">
      <TradersPageHeader
        title="Sanvi overview"
        description="Sales, purchases, money due from partners, and stock at a glance."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={reload} loading={loading && Boolean(data)}><RefreshCw className="h-4 w-4" />Refresh</Button>
            <Button size="sm" onClick={() => navigate('/traders/jobs/new')}><Plus className="h-4 w-4" />New bill</Button>
          </>
        }
      />
      {error && <FormBanner tone="error" title="Could not load overview">{error}</FormBanner>}

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label={`Billed this month · ${show(k?.monthJobs)} bills`} value={show(k?.monthBilled, formatINR)} icon={ReceiptText} tone="amber" onClick={() => navigate('/traders/jobs')} />
        <KpiCard label="Collected this month" value={show(k?.monthCollected, formatINR)} icon={Wallet} tone="emerald" onClick={() => navigate('/traders/reports?tab=payments')} />
        <KpiCard label="Profit this month" value={show(k?.monthProfit, formatINR)} icon={TrendingUp} tone="orange" onClick={() => navigate('/traders/reports')} />
        <KpiCard label={`Money due · ${show(k?.outstandingBills)} bills`} value={show(k?.outstanding, formatINR)} icon={IndianRupee} tone="rose" onClick={() => navigate('/traders/jobs?due=1')} />
        <KpiCard label={`${show(k?.products)} products · ${show(k?.stockUnits)} units`} value={show(k?.stockValue, formatINR)} icon={Boxes} tone="slate" onClick={() => navigate('/traders/stock')} />
        <KpiCard label="Low / out of stock" value={show(k?.lowStock)} icon={TriangleAlert} tone="rose" onClick={() => navigate('/traders/stock')} />
        <KpiCard label="Scheduled installations" value={show(k?.scheduled)} icon={CalendarClock} tone="violet" onClick={() => navigate('/traders/jobs')} />
        <KpiCard label={`Purchased this month · owe ${show(k?.supplierDue, formatINR)}`} value={show(k?.monthPurchased, formatINR)} icon={ShoppingCart} tone="sky" onClick={() => navigate('/traders/purchases')} />
      </div>

      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <Link key={a.to + a.label} to={a.to} className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-3.5 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-500/15 dark:text-amber-300">
            <a.icon className="h-3.5 w-3.5" />{a.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent installation bills</CardTitle>
            <CardDescription>Latest installation bills by partner</CardDescription>
          </CardHeader>
          <CardContent>
            <DataState loading={loading && !data} empty={!data?.recentJobs?.length} emptyTitle="No bills yet" emptyAction={<Button size="sm" variant="outline" onClick={() => navigate('/traders/jobs/new')}>Create the first bill</Button>}>
              <Table>
                <TableHeader><TableRow><TableHead>Bill</TableHead><TableHead>Partner</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Due</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data?.recentJobs?.map((j) => (
                    <TableRow key={j.id} className="cursor-pointer" onClick={() => navigate(`/traders/jobs/${j.id}`)}>
                      <TableCell className="whitespace-nowrap"><p className="font-medium text-amber-700 dark:text-amber-300">{j.billNumber}</p><p className="text-xs text-muted-foreground">{formatDate(j.jobDate)}</p></TableCell>
                      <TableCell><p className="line-clamp-1 font-medium">{j.client?.name}</p><p className="line-clamp-1 text-xs text-muted-foreground">{j.items.length ? j.items.map((i) => `${i.name} ×${i.quantity}`).join(', ') : 'Service only'}</p></TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold">{formatINR(j.total)}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">{j.balance > 0 ? <span className="font-semibold text-rose-600">{formatINR(j.balance)}</span> : <StatusBadge status={j.status === 'cancelled' ? 'cancelled' : 'paid'} />}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataState>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Restock soon</CardTitle>
            <CardDescription>Products at or below their alert level</CardDescription>
          </CardHeader>
          <CardContent>
            <DataState loading={loading && !data} empty={!data?.lowStock?.length} emptyTitle="All stock levels look fine">
              <ul className="space-y-2">
                {data?.lowStock?.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-[hsl(var(--color-muted))]">
                    <ProductThumb product={p} className="h-9 w-9" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.stock} {p.unit} left · alert at {p.reorderLevel}</p>
                    </div>
                    <StockBadge state={p.stockState} />
                  </li>
                ))}
              </ul>
              <Link to="/traders/stock" className="mt-3 block text-center text-xs font-semibold text-amber-700 hover:underline dark:text-amber-300">Open stock</Link>
            </DataState>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
