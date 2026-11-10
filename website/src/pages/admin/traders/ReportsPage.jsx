import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Boxes, Download, IndianRupee, Printer, ReceiptText, Search, ShoppingCart, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import KpiCard from '../../../components/ui/KpiCard';
import DataState from '../../../components/admin/DataState';
import PillTabs from '../../../components/admin/PillTabs';
import StatusBadge from '../../../components/admin/StatusBadge';
import { BrandTile } from '../../../components/marketing/BrandWordmark';
import { ProfitText, StockBadge, TradersPageHeader } from '../../../components/traders/TradersKit';
import { PeriodPicker, presetRange, rangeLabel } from '../../../components/traders/PeriodPicker';
import { BUSINESSES } from '../../../constants/site';
import { PRODUCT_CATEGORIES, categoryLabel } from '../../../constants/traders';
import { cn } from '../../../lib/utils';
import { downloadCsv, formatDate, formatINR } from '../../../lib/format';
import { useApi } from '../../../hooks/useApi';
import { paymentModeLabel } from '../../../constants/institute';

const TABS = [
  { value: 'summary', label: 'Profit & loss' },
  { value: 'sales', label: 'Sales & billing' },
  { value: 'purchases', label: 'Purchases' },
  { value: 'payments', label: 'Payments & dues' },
  { value: 'partners', label: 'Partner-wise' },
  { value: 'stock', label: 'Stock register' },
];

const monthLabel = (key) => new Date(`${key}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

function Section({ title, description, onExport, children }) {
  return (
    <Card className="report-block">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {onExport && <Button size="sm" variant="outline" className="no-print" onClick={onExport}><Download className="h-4 w-4" />CSV</Button>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Line({ label, value, strong, minus, tone }) {
  return (
    <div className={cn('flex justify-between gap-3 py-1.5 text-sm', strong && 'mt-1 border-t border-[hsl(var(--color-border-premium))] pt-2 text-base font-bold')}>
      <span className={strong ? '' : 'text-muted-foreground'}>{label}</span>
      <span className={cn('font-semibold', tone)}>{minus ? `− ${formatINR(value)}` : formatINR(value)}</span>
    </div>
  );
}

function MonthChart({ rows }) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.billed, r.collected]));
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted-foreground">No sales in this period.</p>;
  return (
    <div>
      <div className="flex h-44 items-end gap-2 overflow-x-auto">
        {rows.map((r) => (
          <div key={r.month} className="flex min-w-[2.75rem] flex-1 flex-col items-center gap-1">
            <div className="flex h-36 w-full items-end justify-center gap-0.5">
              <div title={`Billed ${formatINR(r.billed)}`} className="w-1/3 rounded-t bg-gradient-to-t from-amber-600 to-amber-400" style={{ height: `${Math.max(2, (r.billed / max) * 100)}%` }} />
              <div title={`Collected ${formatINR(r.collected)}`} className="w-1/3 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400" style={{ height: `${Math.max(2, (r.collected / max) * 100)}%` }} />
              <div title={`Profit ${formatINR(r.profit)}`} className="w-1/3 rounded-t bg-gradient-to-t from-stone-700 to-stone-500" style={{ height: `${Math.max(2, (Math.max(0, r.profit) / max) * 100)}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground">{monthLabel(r.month)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-amber-500" />Billed</span>
        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-emerald-500" />Collected</span>
        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-stone-600" />Profit</span>
      </div>
    </div>
  );
}

function SummaryTab({ r }) {
  const s = r.summary;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Section title="Profit & loss" description={`${s.bills} bills${s.cancelled ? ` · ${s.cancelled} cancelled` : ''}`}>
        <Line label="Parts sold" value={s.partsSales} />
        <Line label="Installation charges" value={s.labour} />
        {s.discount > 0 && <Line label="Discounts given" value={s.discount} minus />}
        <Line label="Sales (excl. GST)" value={s.revenue} strong />
        <Line label="Cost of parts" value={s.partsCost} minus />
        <Line label={`Net profit · ${s.margin}% margin`} value={s.profit} strong tone={s.profit < 0 ? 'text-rose-600' : 'text-emerald-600'} />
        <p className="mt-2 text-xs text-muted-foreground">GST collected {formatINR(s.tax)} is not counted as income.</p>
      </Section>
      <Section title="Month by month" description="Billed, collected and profit">
        <MonthChart rows={r.sales.byMonth} />
      </Section>
      <Section title="Buying & stock" description="Purchases are stock, not expenses; their cost counts only when the parts are sold.">
        <Line label="Goods purchased (bill totals)" value={s.purchased} />
        <Line label="Paid to suppliers in this period" value={s.supplierPaid} />
        <Line label="Owed to suppliers (all bills)" value={s.supplierDue} tone={s.supplierDue > 0 ? 'text-rose-600' : ''} />
        <Line label="Stock value now (at average cost)" value={r.stock.totals.costValue} strong />
      </Section>
    </div>
  );
}

function PurchasesTab({ r, range }) {
  const p = r.purchases;
  const s = p.summary;
  const exportBills = () => downloadCsv(`sanvi-purchases${range}.csv`, [
    { label: 'Purchase', value: (x) => x.purchaseNumber }, { label: 'Date', value: (x) => formatDate(x.purchaseDate) }, { label: 'Supplier', value: (x) => x.supplier },
    { label: 'Supplier invoice', value: (x) => x.supplierInvoice }, { label: 'Units', value: (x) => x.units }, { label: 'Goods value', value: (x) => x.itemsTotal },
    { label: 'Freight', value: (x) => x.freight }, { label: 'GST', value: (x) => x.taxAmount }, { label: 'Discount', value: (x) => x.discount },
    { label: 'Bill total', value: (x) => x.total }, { label: 'Paid', value: (x) => x.paid }, { label: 'Owed', value: (x) => x.balance },
  ], p.bills);
  const exportSuppliers = () => downloadCsv(`sanvi-purchases-by-supplier${range}.csv`, [
    { label: 'Supplier', value: (x) => x.name }, { label: 'Code', value: (x) => x.supplierCode }, { label: 'Phone', value: (x) => x.phone },
    { label: 'Bills', value: (x) => x.bills }, { label: 'Units', value: (x) => x.units }, { label: 'Purchased', value: (x) => x.total },
    { label: 'Paid', value: (x) => x.paid }, { label: 'Owed', value: (x) => x.balance },
  ], p.bySupplier);
  const exportProducts = () => downloadCsv(`sanvi-purchases-by-product${range}.csv`, [
    { label: 'Product', value: (x) => x.name }, { label: 'SKU', value: (x) => x.sku }, { label: 'Qty bought', value: (x) => x.quantity }, { label: 'Unit', value: (x) => x.unit },
    { label: 'Average rate', value: (x) => x.avgCost }, { label: 'Lowest rate', value: (x) => x.minCost }, { label: 'Highest rate', value: (x) => x.maxCost },
    { label: 'Value', value: (x) => x.value }, { label: 'Bills', value: (x) => x.bills },
  ], p.byProduct);
  const exportDues = () => downloadCsv('sanvi-supplier-dues.csv', [
    { label: 'Purchase', value: (x) => x.purchaseNumber }, { label: 'Date', value: (x) => formatDate(x.purchaseDate) }, { label: 'Days', value: (x) => x.days },
    { label: 'Supplier', value: (x) => x.supplier }, { label: 'Supplier invoice', value: (x) => x.supplierInvoice },
    { label: 'Bill total', value: (x) => x.total }, { label: 'Paid', value: (x) => x.paid }, { label: 'Owed', value: (x) => x.balance },
  ], p.dues);
  const top = Math.max(1, ...p.byMonth.map((m) => m.total));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label={`Purchased · ${s.bills} bills`} value={formatINR(s.total)} icon={ShoppingCart} tone="amber" />
        <KpiCard label="Units received" value={s.units} icon={Boxes} tone="slate" />
        <KpiCard label="Paid to suppliers (period)" value={formatINR(s.paidInPeriod)} icon={Wallet} tone="emerald" />
        <KpiCard label="Owed to suppliers (all)" value={formatINR(s.owed)} icon={IndianRupee} tone="rose" />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Section title="Purchase cost breakdown">
          <Line label="Goods value" value={s.itemsTotal} />
          <Line label="Freight / transport" value={s.freight} />
          <Line label="GST paid" value={s.tax} />
          {s.discount > 0 && <Line label="Discount received" value={s.discount} minus />}
          <Line label="Total purchased" value={s.total} strong />
          <Line label="Paid on these bills" value={s.paidOnBills} tone="text-emerald-600" />
          <Line label="Still owed on these bills" value={s.dueOnBills} tone={s.dueOnBills > 0 ? 'text-rose-600' : ''} />
        </Section>
        <Section title="Month by month" description="Purchase bill totals">
          {p.byMonth.length ? (
            <div className="space-y-2.5">
              {p.byMonth.map((m) => (
                <div key={m.month}>
                  <div className="flex justify-between text-sm"><span className="font-medium">{monthLabel(m.month)} <span className="text-xs text-muted-foreground">· {m.bills} bills</span></span><span className="font-semibold">{formatINR(m.total)}</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-[hsl(var(--color-muted))]"><div className="h-full rounded-full bg-gradient-to-r from-stone-400 to-amber-600" style={{ width: `${(m.total / top) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">No purchases in this period.</p>}
        </Section>
      </div>
      <Section title="By supplier" description="Who you bought from in this period" onExport={exportSuppliers}>
        <DataState empty={!p.bySupplier.length} emptyTitle="No purchases in this period" emptyAction={<Link to="/traders/purchases/new"><Button size="sm" variant="outline">Record purchase</Button></Link>}>
          <Table>
            <TableHeader><TableRow><TableHead>Supplier</TableHead><TableHead className="text-right">Bills</TableHead><TableHead className="text-right">Units</TableHead><TableHead className="text-right">Purchased</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Owed</TableHead></TableRow></TableHeader>
            <TableBody>
              {p.bySupplier.map((x) => (
                <TableRow key={x.supplierId || x.name}>
                  <TableCell><Link to={`/traders/purchases?supplier=${x.supplierId}`} className="font-medium hover:underline">{x.name}</Link><p className="text-xs text-muted-foreground">{x.supplierCode}{x.phone ? ` · ${x.phone}` : ''}</p></TableCell>
                  <TableCell className="text-right">{x.bills}</TableCell>
                  <TableCell className="text-right">{x.units}</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold">{formatINR(x.total)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right text-emerald-600">{formatINR(x.paid)}</TableCell>
                  <TableCell className={cn('whitespace-nowrap text-right', x.balance > 0 && 'font-semibold text-rose-600')}>{formatINR(x.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
      </Section>
      <Section title="By product" description="Quantity bought and the rates you paid" onExport={exportProducts}>
        <DataState empty={!p.byProduct.length} emptyTitle="No products bought in this period">
          <Table>
            <TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Avg rate</TableHead><TableHead className="text-right">Rate range</TableHead><TableHead className="text-right">Value</TableHead></TableRow></TableHeader>
            <TableBody>
              {p.byProduct.map((x) => (
                <TableRow key={x.productId}>
                  <TableCell className="max-w-[16rem]"><Link to={`/traders/purchases?product=${x.productId}`} className="line-clamp-1 font-medium hover:underline">{x.name}</Link><p className="text-xs text-muted-foreground">{x.sku} · {x.bills} bills</p></TableCell>
                  <TableCell className="whitespace-nowrap text-right">{x.quantity} <span className="text-xs text-muted-foreground">{x.unit}</span></TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold">{formatINR(x.avgCost)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground">{x.minCost === x.maxCost ? '—' : `${formatINR(x.minCost)} – ${formatINR(x.maxCost)}`}</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold">{formatINR(x.value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
      </Section>
      <Section title="All purchase bills" onExport={exportBills}>
        <DataState empty={!p.bills.length} emptyTitle="No purchase bills in this period">
          <Table>
            <TableHeader><TableRow><TableHead>Purchase</TableHead><TableHead>Supplier</TableHead><TableHead className="text-right">Units</TableHead><TableHead className="text-right">Bill</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Owed</TableHead></TableRow></TableHeader>
            <TableBody>
              {p.bills.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="whitespace-nowrap"><Link to={`/traders/purchases/${b.id}`} className="font-medium text-amber-700 hover:underline dark:text-amber-300">{b.purchaseNumber}</Link><p className="text-xs text-muted-foreground">{formatDate(b.purchaseDate)}{b.supplierInvoice ? ` · inv. ${b.supplierInvoice}` : ''}</p></TableCell>
                  <TableCell className="text-sm">{b.supplier}</TableCell>
                  <TableCell className="text-right">{b.units}</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold">{formatINR(b.total)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right text-emerald-600">{formatINR(b.paid)}</TableCell>
                  <TableCell className={cn('whitespace-nowrap text-right', b.balance > 0 && 'font-semibold text-rose-600')}>{formatINR(b.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
      </Section>
      <Section title="Suppliers you still owe" description="All open purchase bills, whatever the period" onExport={exportDues}>
        <DataState empty={!p.dues.length} emptyTitle="Nothing owed — every supplier is paid">
          <Table>
            <TableHeader><TableRow><TableHead>Purchase</TableHead><TableHead>Supplier</TableHead><TableHead className="text-right">Bill</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Owed</TableHead></TableRow></TableHeader>
            <TableBody>
              {p.dues.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="whitespace-nowrap"><Link to={`/traders/purchases/${d.id}`} className="font-medium text-amber-700 hover:underline dark:text-amber-300">{d.purchaseNumber}</Link><p className="text-xs text-muted-foreground">{formatDate(d.purchaseDate)} · {d.days} days</p></TableCell>
                  <TableCell className="text-sm">{d.supplier}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">{formatINR(d.total)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right text-emerald-600">{formatINR(d.paid)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold text-rose-600">{formatINR(d.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
      </Section>
    </div>
  );
}

function SalesTab({ r, range }) {
  const products = r.sales.byProduct;
  const exportProducts = () => downloadCsv(`sanvi-sales-by-product${range}.csv`, [
    { label: 'Product', value: (x) => x.name }, { label: 'SKU', value: (x) => x.sku }, { label: 'Category', value: (x) => categoryLabel(x.category) },
    { label: 'Qty sold', value: (x) => x.quantity }, { label: 'Bills', value: (x) => x.bills }, { label: 'Sales', value: (x) => x.sales },
    { label: 'Cost', value: (x) => x.cost }, { label: 'Profit', value: (x) => x.profit },
  ], products);
  const exportBills = () => downloadCsv(`sanvi-bills${range}.csv`, [
    { label: 'Bill', value: (x) => x.billNumber }, { label: 'Date', value: (x) => formatDate(x.jobDate) }, { label: 'Partner', value: (x) => x.client },
    { label: 'Status', value: (x) => x.status }, { label: 'Bill amount', value: (x) => x.total },
    { label: 'GST', value: (x) => x.taxAmount }, { label: 'Paid', value: (x) => x.paid }, { label: 'Due', value: (x) => x.balance },
    { label: 'Parts cost', value: (x) => x.itemsCost }, { label: 'Profit', value: (x) => x.profit },
  ], r.sales.bills);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Section title="Sales by product" description="Best sellers first" onExport={exportProducts}>
          <DataState empty={!products.length} emptyTitle="No parts sold in this period">
            <Table>
              <TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Sales</TableHead><TableHead className="text-right">Cost</TableHead><TableHead className="text-right">Profit</TableHead></TableRow></TableHeader>
              <TableBody>
                {products.map((x) => (
                  <TableRow key={`${x.productId || x.name}`}>
                    <TableCell className="max-w-[16rem]"><p className="line-clamp-1 font-medium">{x.name}</p><p className="text-xs text-muted-foreground">{x.sku || 'Custom line'} · {categoryLabel(x.category)}</p></TableCell>
                    <TableCell className="text-right">{x.quantity} <span className="text-xs text-muted-foreground">{x.unit}</span></TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold">{formatINR(x.sales)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right text-muted-foreground">{formatINR(x.cost)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right"><ProfitText value={x.profit} format={formatINR} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataState>
        </Section>
        <Section title="By category">
          <DataState empty={!r.sales.byCategory.length} emptyTitle="No sales">
            <div className="space-y-2.5">
              {r.sales.byCategory.map((c) => {
                const top = r.sales.byCategory[0]?.sales || 1;
                return (
                  <div key={c.category}>
                    <div className="flex justify-between text-sm"><span className="font-medium">{categoryLabel(c.category)}</span><span className="font-semibold">{formatINR(c.sales)}</span></div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-[hsl(var(--color-muted))]"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-600" style={{ width: `${(c.sales / top) * 100}%` }} /></div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{c.quantity} units · profit {formatINR(c.profit)}</p>
                  </div>
                );
              })}
            </div>
          </DataState>
        </Section>
      </div>
      <Section title="All bills" description="Every bill in the period with its money and profit" onExport={exportBills}>
        <DataState empty={!r.sales.bills.length} emptyTitle="No bills in this period">
          <Table>
            <TableHeader><TableRow><TableHead>Bill</TableHead><TableHead>Partner</TableHead><TableHead className="text-right">Bill</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Due</TableHead><TableHead className="text-right">Profit</TableHead></TableRow></TableHeader>
            <TableBody>
              {r.sales.bills.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="whitespace-nowrap"><Link to={`/traders/jobs/${b.id}`} className="font-medium text-amber-700 hover:underline dark:text-amber-300">{b.billNumber}</Link><p className="text-xs text-muted-foreground">{formatDate(b.jobDate)}</p></TableCell>
                  <TableCell className="max-w-[12rem]">{b.partnerId ? <Link to={`/traders/jobs?partner=${b.partnerId}`} className="line-clamp-1 hover:underline">{b.client}</Link> : <span className="line-clamp-1">{b.client}</span>}</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold">{formatINR(b.total)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right text-emerald-600">{formatINR(b.paid)}</TableCell>
                  <TableCell className={cn('whitespace-nowrap text-right', b.balance > 0 && 'font-semibold text-rose-600')}>{formatINR(b.balance)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right"><ProfitText value={b.profit} format={formatINR} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
      </Section>
    </div>
  );
}

function PaymentsTab({ r, range }) {
  const p = r.payments;
  const exportPayments = () => downloadCsv(`sanvi-payments${range}.csv`, [
    { label: 'Date', value: (x) => formatDate(x.date) }, { label: 'Bill', value: (x) => x.billNumber }, { label: 'Partner', value: (x) => x.client },
    { label: 'Mode', value: (x) => paymentModeLabel(x.mode) }, { label: 'Reference', value: (x) => x.reference }, { label: 'Amount', value: (x) => x.amount },
  ], p.list);
  const exportDues = () => downloadCsv('sanvi-dues.csv', [
    { label: 'Bill', value: (x) => x.billNumber }, { label: 'Date', value: (x) => formatDate(x.jobDate) }, { label: 'Days', value: (x) => x.days },
    { label: 'Partner', value: (x) => x.client?.name }, { label: 'Phone', value: (x) => x.client?.phone },
    { label: 'Bill amount', value: (x) => x.total }, { label: 'Paid', value: (x) => x.paid }, { label: 'Due', value: (x) => x.balance },
  ], p.dues);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <Section title="Collected by mode" description={`${p.list.length} payments in this period`}>
          {Object.keys(p.byMode).length ? Object.entries(p.byMode).map(([mode, amount]) => <Line key={mode} label={paymentModeLabel(mode)} value={amount} />) : <p className="py-4 text-center text-sm text-muted-foreground">No payments in this period.</p>}
          {Object.keys(p.byMode).length > 0 && <Line label="Total collected" value={r.summary.collected} strong tone="text-emerald-600" />}
        </Section>
        <Section title="Money due — ageing" description="All open bills, whatever the period">
          {p.ageing.map((a) => (
            <div key={a.label} className="flex justify-between py-1.5 text-sm">
              <span className="text-muted-foreground">{a.label} <span className="text-xs">({a.bills} bills)</span></span>
              <span className={cn('font-semibold', a.amount > 0 && a.label.startsWith('90') && 'text-rose-600')}>{formatINR(a.amount)}</span>
            </div>
          ))}
          <Line label="Total outstanding" value={r.summary.outstanding} strong tone="text-rose-600" />
        </Section>
      </div>
      <Section title="Partners who still owe" onExport={exportDues}>
        <DataState empty={!p.dues.length} emptyTitle="Nothing due — every bill is paid">
          <Table>
            <TableHeader><TableRow><TableHead>Bill</TableHead><TableHead>Partner</TableHead><TableHead className="text-right">Bill</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Due</TableHead></TableRow></TableHeader>
            <TableBody>
              {p.dues.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="whitespace-nowrap"><Link to={`/traders/jobs/${d.id}`} className="font-medium text-amber-700 hover:underline dark:text-amber-300">{d.billNumber}</Link><p className="text-xs text-muted-foreground">{formatDate(d.jobDate)} · {d.days} days</p></TableCell>
                  <TableCell>
                    {d.partnerId ? <Link to={`/traders/jobs?partner=${d.partnerId}`} className="font-medium hover:underline">{d.client?.name}</Link> : <p className="font-medium">{d.client?.name}</p>}
                    <p className="text-xs text-muted-foreground">{d.client?.phone}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">{formatINR(d.total)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right text-emerald-600">{formatINR(d.paid)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold text-rose-600">{formatINR(d.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
      </Section>
      <Section title="Payments received" onExport={exportPayments}>
        <DataState empty={!p.list.length} emptyTitle="No payments in this period">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Bill</TableHead><TableHead>Partner</TableHead><TableHead>Mode</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
            <TableBody>
              {p.list.map((x, i) => (
                <TableRow key={`${x.jobId}-${i}`}>
                  <TableCell className="whitespace-nowrap">{formatDate(x.date)}</TableCell>
                  <TableCell><Link to={`/traders/jobs/${x.jobId}`} className="font-medium text-amber-700 hover:underline dark:text-amber-300">{x.billNumber}</Link></TableCell>
                  <TableCell>{x.client}</TableCell>
                  <TableCell className="text-sm">{paymentModeLabel(x.mode)}{x.reference ? ` · ${x.reference}` : ''}</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold">{formatINR(x.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
      </Section>
    </div>
  );
}

function PartnersTab({ r, range }) {
  const rows = r.partners;
  const sum = (key) => rows.reduce((t, x) => t + x[key], 0);
  const exportCsv = () => downloadCsv(`sanvi-partners${range}.csv`, [
    { label: 'Partner', value: (x) => x.name }, { label: 'Code', value: (x) => x.partnerCode }, { label: 'Phone', value: (x) => x.phone },
    { label: 'Bills', value: (x) => x.bills }, { label: 'Installed', value: (x) => x.installed }, { label: 'Scheduled', value: (x) => x.scheduled }, { label: 'Items installed', value: (x) => x.parts },
    { label: 'Billed', value: (x) => x.billed }, { label: 'Paid on bills', value: (x) => x.paid }, { label: 'Due', value: (x) => x.balance },
    { label: 'Collected in period', value: (x) => x.collected }, { label: 'Profit', value: (x) => x.profit },
  ], rows);
  return (
    <Section title="Partner-wise" description="Bills, items installed, paid, due and profit for each partner (client) in this period" onExport={exportCsv}>
      <DataState empty={!rows.length} emptyTitle="No partners yet" emptyAction={<Link to="/traders/jobs"><Button size="sm" variant="outline">Add partners</Button></Link>}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner</TableHead><TableHead className="text-right">Bills</TableHead><TableHead className="text-right">Items</TableHead><TableHead className="text-right">Billed</TableHead>
              <TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Due</TableHead><TableHead className="text-right">Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((x) => (
              <TableRow key={x.partnerId}>
                <TableCell><Link to={`/traders/jobs?partner=${x.partnerId}`} className="font-medium hover:underline">{x.name}</Link><p className="text-xs text-muted-foreground">{x.partnerCode} · {x.phone}</p></TableCell>
                <TableCell className="text-right">{x.bills}{x.scheduled > 0 && <span className="block text-[11px] text-muted-foreground">{x.scheduled} scheduled</span>}</TableCell>
                <TableCell className="text-right">{x.parts}</TableCell>
                <TableCell className="whitespace-nowrap text-right font-semibold">{formatINR(x.billed)}</TableCell>
                <TableCell className="whitespace-nowrap text-right text-emerald-600">{formatINR(x.paid)}</TableCell>
                <TableCell className={cn('whitespace-nowrap text-right', x.balance > 0 && 'font-semibold text-rose-600')}>{formatINR(x.balance)}</TableCell>
                <TableCell className="whitespace-nowrap text-right"><ProfitText value={x.profit} format={formatINR} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="font-bold">
              <TableCell>Total</TableCell><TableCell className="text-right">{sum('bills')}</TableCell><TableCell className="text-right">{sum('parts')}</TableCell>
              <TableCell className="text-right">{formatINR(sum('billed'))}</TableCell><TableCell className="text-right">{formatINR(sum('paid'))}</TableCell>
              <TableCell className="text-right">{formatINR(sum('balance'))}</TableCell><TableCell className="text-right">{formatINR(sum('profit'))}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </DataState>
    </Section>
  );
}

const qty = (n) => (n ? n : '—');

function StockTab({ r, range }) {
  const st = r.stock;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [moved, setMoved] = useState('');
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return st.rows.filter((x) => (!q || `${x.name} ${x.sku} ${x.brand || ''}`.toLowerCase().includes(q))
      && (!category || x.category === category)
      && (!moved || (moved === 'moved' ? x.purchased || x.sold || x.added || x.adjusted : x.stockState !== 'ok')));
  }, [st.rows, query, category, moved]);
  const sum = (key) => rows.reduce((t, x) => t + x[key], 0);
  const exportCsv = () => downloadCsv(`sanvi-stock-register${range}.csv`, [
    { label: 'SKU', value: (x) => x.sku }, { label: 'Product', value: (x) => x.name }, { label: 'Category', value: (x) => categoryLabel(x.category) }, { label: 'Brand', value: (x) => x.brand }, { label: 'Unit', value: (x) => x.unit },
    { label: 'Opening qty', value: (x) => x.opening }, { label: 'Opening stock entered', value: (x) => x.added }, { label: 'Bought qty', value: (x) => x.purchased }, { label: 'Bought value', value: (x) => x.purchaseValue },
    { label: 'Sold qty', value: (x) => x.sold }, { label: 'Sales', value: (x) => x.sales }, { label: 'Cost of sold', value: (x) => x.soldCost }, { label: 'Profit', value: (x) => x.profit },
    { label: 'Corrections', value: (x) => x.adjusted }, { label: 'Closing qty', value: (x) => x.closing }, { label: 'Closing value (avg cost)', value: (x) => x.closingValue },
    { label: 'In stock now', value: (x) => x.stock }, { label: 'Avg cost now', value: (x) => x.costPrice }, { label: 'Selling price', value: (x) => x.sellingPrice }, { label: 'Alert at', value: (x) => x.reorderLevel },
  ], rows);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label={`Opening ${st.totals.opening + st.totals.added} → closing ${st.totals.closing} units`} value={formatINR(st.totals.closingValue)} icon={Boxes} tone="amber" />
        <KpiCard label={`Bought · ${st.totals.purchased} units`} value={formatINR(st.totals.purchaseValue)} icon={ShoppingCart} tone="slate" />
        <KpiCard label={`Sold · ${st.totals.sold} units`} value={formatINR(st.totals.sales)} icon={ReceiptText} tone="orange" />
        <KpiCard label={`Profit on parts · cost ${formatINR(st.totals.soldCost)}`} value={formatINR(st.totals.profit)} icon={TrendingUp} tone="emerald" />
      </div>
      <Section title="Stock register" description="Opening + entered + bought − sold ± corrections = closing, for the selected period. Values at average cost." onExport={exportCsv}>
        <div className="no-print mb-3 grid grid-cols-2 gap-2 md:grid-cols-3">
          <Input placeholder="Search product, SKU, brand…" iconLeft={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} className="col-span-2 md:col-span-1" />
          <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="">All categories</option>
            {PRODUCT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
          <Select value={moved} onChange={(e) => setMoved(e.target.value)} aria-label="Show">
            <option value="">All products</option>
            <option value="moved">Bought or sold in period</option>
            <option value="low">Low or out of stock now</option>
          </Select>
        </div>
        <DataState empty={!rows.length} emptyTitle="No products match">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead><TableHead className="text-right">Opening</TableHead><TableHead className="text-right">Bought</TableHead><TableHead className="text-right">Sold</TableHead>
                <TableHead className="text-right">Corr.</TableHead><TableHead className="text-right">Closing</TableHead><TableHead className="text-right">Bought ₹</TableHead>
                <TableHead className="text-right">Sales ₹</TableHead><TableHead className="text-right">Cost ₹</TableHead><TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((x) => (
                <TableRow key={x.productId} className={x.status === 'inactive' ? 'opacity-60' : undefined}>
                  <TableCell className="min-w-[12rem] max-w-[16rem]">
                    <p className="line-clamp-1 font-medium">{x.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{x.sku} {x.status === 'inactive' ? <StatusBadge status="inactive" className="px-1.5 py-0 text-[10px]" /> : x.stockState !== 'ok' && <StockBadge state={x.stockState} />}</p>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{x.opening + x.added || '—'}</TableCell>
                  <TableCell className="text-right text-emerald-600">{x.purchased ? `+${x.purchased}` : '—'}</TableCell>
                  <TableCell className="text-right text-rose-600">{x.sold ? `−${x.sold}` : '—'}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{x.adjusted > 0 ? `+${x.adjusted}` : qty(x.adjusted)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-bold">{x.closing} <span className="text-xs font-normal text-muted-foreground">{x.unit}</span></TableCell>
                  <TableCell className="whitespace-nowrap text-right">{x.purchaseValue ? formatINR(x.purchaseValue) : '—'}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">{x.sales ? formatINR(x.sales) : '—'}</TableCell>
                  <TableCell className="whitespace-nowrap text-right text-muted-foreground">{x.soldCost ? formatINR(x.soldCost) : '—'}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">{x.sales ? <ProfitText value={x.profit} format={formatINR} /> : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="font-bold">
                <TableCell>Total · {rows.length} products</TableCell>
                <TableCell className="text-right">{sum('opening') + sum('added')}</TableCell><TableCell className="text-right">{sum('purchased')}</TableCell><TableCell className="text-right">{sum('sold')}</TableCell>
                <TableCell className="text-right">{sum('adjusted')}</TableCell><TableCell className="text-right">{sum('closing')}</TableCell><TableCell className="text-right">{formatINR(sum('purchaseValue'))}</TableCell>
                <TableCell className="text-right">{formatINR(sum('sales'))}</TableCell><TableCell className="text-right">{formatINR(sum('soldCost'))}</TableCell><TableCell className="text-right">{formatINR(sum('profit'))}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </DataState>
        <p className="mt-2 text-[11px] text-muted-foreground">Sales, cost and profit count parts on installation bills dated in the period. Closing value uses today's average cost.</p>
      </Section>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label={`In stock now · ${st.totals.products} products`} value={`${st.totals.units} units`} icon={Boxes} tone="amber" />
        <KpiCard label="Value at cost now" value={formatINR(st.totals.costValue)} icon={Wallet} tone="slate" />
        <KpiCard label="Value at selling price now" value={formatINR(st.totals.saleValue)} icon={IndianRupee} tone="orange" />
        <KpiCard label="Low / out" value={`${st.totals.low} / ${st.totals.out}`} icon={Boxes} tone="rose" />
      </div>
      <Section title="Stock by category">
        <Table>
          <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Products</TableHead><TableHead className="text-right">Units</TableHead><TableHead className="text-right">Value (cost)</TableHead><TableHead className="text-right">Value (price)</TableHead><TableHead className="text-right">Low / out</TableHead></TableRow></TableHeader>
          <TableBody>
            {st.byCategory.map((c) => (
              <TableRow key={c.category}>
                <TableCell className="font-medium">{categoryLabel(c.category)}</TableCell>
                <TableCell className="text-right">{c.products}</TableCell>
                <TableCell className="text-right">{c.units}</TableCell>
                <TableCell className="whitespace-nowrap text-right">{formatINR(c.costValue)}</TableCell>
                <TableCell className="whitespace-nowrap text-right">{formatINR(c.saleValue)}</TableCell>
                <TableCell className={cn('text-right', (c.low || c.out) && 'font-semibold text-rose-600')}>{c.low} / {c.out}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>
    </div>
  );
}

export default function TradersReportsPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'summary';
  const [period, setPeriod] = useState(() => presetRange('month'));
  const { from, to } = period;
  const { data, loading, error, reload } = useApi('/admin/traders/reports', { from, to });
  const rangeSuffix = `${from ? `-${from}` : ''}${to ? `-to-${to}` : ''}`;
  const rangeText = rangeLabel(period);
  const info = BUSINESSES.traders;
  const s = data?.summary;

  useEffect(() => {
    const previous = document.title;
    document.title = `${info.name} - ${TABS.find((t) => t.value === tab).label} report`;
    return () => { document.title = previous; };
  }, [tab, info.name]);

  return (
    <div className="space-y-3">
      <div className="no-print">
        <TradersPageHeader
          title="Reports"
          description="Stock, purchases, sales, payments, profit and partner-wise bills for any date range or year."
          actions={<Button size="sm" onClick={() => window.print()} disabled={!data}><Printer className="h-4 w-4" />Print / Save PDF</Button>}
        />
      </div>

      <div className="hidden items-center justify-between border-b border-slate-300 pb-3 print:flex">
        <div className="flex items-center gap-3">
          <BrandTile business="traders" size="md" />
          <div>
            <p className="text-lg font-extrabold">{info.name}</p>
            <p className="text-xs text-slate-500">{info.address} · {info.phone}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">{TABS.find((t) => t.value === tab).label} report</p>
          <p className="text-xs text-slate-500">{rangeText}</p>
        </div>
      </div>

      <Card className="no-print">
        <CardContent className="pt-3">
          <PeriodPicker value={period} onChange={setPeriod} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label={`Billed · ${s?.bills ?? 0} bills`} value={s ? formatINR(s.billed) : '—'} icon={ReceiptText} tone="amber" />
        <KpiCard label="Collected" value={s ? formatINR(s.collected) : '—'} icon={Wallet} tone="emerald" />
        <KpiCard label="Outstanding (all bills)" value={s ? formatINR(s.outstanding) : '—'} icon={IndianRupee} tone="rose" onClick={() => setParams({ tab: 'payments' })} />
        <KpiCard label={s ? `Profit · ${s.margin}% margin` : 'Profit'} value={s ? formatINR(s.profit) : '—'} icon={TrendingUp} tone="orange" />
      </div>

      <div className="no-print"><PillTabs tabs={TABS} value={tab} onChange={(value) => setParams({ tab: value })} /></div>

      <DataState loading={loading && !data} error={error} onRetry={reload} rows={6}>
        {data && (
          <>
            {tab === 'summary' && <SummaryTab r={data} />}
            {tab === 'sales' && <SalesTab r={data} range={rangeSuffix} />}
            {tab === 'purchases' && <PurchasesTab r={data} range={rangeSuffix} />}
            {tab === 'payments' && <PaymentsTab r={data} range={rangeSuffix} />}
            {tab === 'partners' && <PartnersTab r={data} range={rangeSuffix} />}
            {tab === 'stock' && <StockTab r={data} range={rangeSuffix} />}
          </>
        )}
      </DataState>
    </div>
  );
}
