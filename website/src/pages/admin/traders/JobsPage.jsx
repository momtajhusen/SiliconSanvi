import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Download, FileText, HandCoins, IndianRupee, Mail, MapPin, Package, Pencil, Phone, Plus, ReceiptText, Search, Trash2, TrendingUp, UserPlus, Users, Wallet, X,
} from 'lucide-react';
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
import { ProfitText, TradersPageHeader } from '../../../components/traders/TradersKit';
import JobPaymentModal from '../../../components/traders/JobPaymentModal';
import PartnerFormModal from '../../../components/traders/PartnerFormModal';
import { JOB_PAYMENT_STATUSES, JOB_STATUSES } from '../../../constants/traders';
import { cn } from '../../../lib/utils';
import { downloadCsv, formatDate, formatINR, initials, labelize } from '../../../lib/format';
import { useApi, useDebounced } from '../../../hooks/useApi';
import api, { apiError } from '../../../lib/api';

function PartnerAvatar({ name, className = 'h-9 w-9' }) {
  return (
    <span className={cn(className, 'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-xs font-bold text-white')}>
      {initials(name)}
    </span>
  );
}

function PartnerList({ partners, loading, selectedId, onSelect, onAdd }) {
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();
  const shown = term
    ? partners.filter((p) => [p.name, p.phone, p.partnerCode, p.address].some((v) => v?.toLowerCase().includes(term)))
    : partners;
  const totalDue = partners.reduce((t, p) => t + (p.stats?.balance || 0), 0);

  return (
    <Card className="lg:sticky lg:top-3 lg:self-start">
      <CardContent className="space-y-2 pt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Partners <span className="text-xs font-normal text-muted-foreground">({partners.length})</span></p>
          <Button size="sm" variant="outline" onClick={onAdd}><UserPlus className="h-4 w-4" />Add</Button>
        </div>
        <Input placeholder="Name, phone, address…" iconLeft={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="max-h-64 space-y-1 overflow-y-auto pr-1 lg:max-h-[calc(100vh-15rem)]">
          <button
            type="button"
            onClick={() => onSelect('')}
            className={cn('flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition', !selectedId ? 'bg-amber-500/15 ring-1 ring-amber-500/40' : 'hover:bg-[hsl(var(--color-muted))]')}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--color-muted))]"><Users className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">All partners</span>
              <span className="block text-xs text-muted-foreground">Every bill</span>
            </span>
            {totalDue > 0 && <span className="text-xs font-semibold text-rose-600">{formatINR(totalDue)}</span>}
          </button>
          {loading && !partners.length && <p className="px-2 py-4 text-center text-xs text-muted-foreground">Loading…</p>}
          {!loading && !partners.length && <p className="px-2 py-4 text-center text-xs text-muted-foreground">No partners yet. Add the client before making their bill.</p>}
          {shown.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition',
                selectedId === p.id ? 'bg-amber-500/15 ring-1 ring-amber-500/40' : 'hover:bg-[hsl(var(--color-muted))]',
                p.status !== 'active' && 'opacity-60'
              )}
            >
              <PartnerAvatar name={p.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{p.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{p.phone} · {p.stats?.jobs || 0} bills</span>
              </span>
              {p.stats?.balance > 0
                ? <span className="whitespace-nowrap text-xs font-semibold text-rose-600">{formatINR(p.stats.balance)}</span>
                : p.stats?.jobs > 0 && <span className="text-[10px] font-semibold uppercase text-emerald-600">Paid</span>}
            </button>
          ))}
          {term && !shown.length && <p className="px-2 py-3 text-center text-xs text-muted-foreground">No partner matches “{search}”.</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function PartnerCard({ partner, rows, onEdit, onRemove, onNewBill, onClose }) {
  const [showItems, setShowItems] = useState(false);
  const items = useMemo(() => {
    const map = new Map();
    for (const j of rows) {
      if (j.status === 'cancelled') continue;
      for (const i of j.items) {
        const key = i.productId || `custom:${i.name.toLowerCase()}`;
        const row = map.get(key) || { key, name: i.name, unit: i.unit, quantity: 0, amount: 0 };
        row.quantity += i.quantity;
        row.amount += i.quantity * i.unitPrice;
        map.set(key, row);
      }
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount);
  }, [rows]);

  return (
    <Card className="border-amber-500/30">
      <CardContent className="space-y-3 pt-4">
        <div className="flex flex-wrap items-start gap-3">
          <PartnerAvatar name={partner.name} className="h-12 w-12" />
          <div className="min-w-0 flex-1 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-bold">{partner.name}</p>
              <span className="text-xs text-muted-foreground">{partner.partnerCode}</span>
              {partner.status !== 'active' && <StatusBadge status={partner.status} />}
            </div>
            <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <a href={`tel:${partner.phone}`} className="inline-flex items-center gap-1 hover:text-foreground"><Phone className="h-3.5 w-3.5" />{partner.phone}</a>
              {partner.email && <a href={`mailto:${partner.email}`} className="inline-flex items-center gap-1 hover:text-foreground"><Mail className="h-3.5 w-3.5" />{partner.email}</a>}
              {partner.address && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{partner.address}</span>}
              {partner.gstin && <span>GSTIN {partner.gstin}</span>}
            </p>
            {partner.notes && <p className="mt-1 text-xs text-muted-foreground">{partner.notes}</p>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" onClick={onNewBill}><Plus className="h-4 w-4" />New bill</Button>
            <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="h-4 w-4" />Edit</Button>
            <Button size="sm" variant="outline" onClick={onRemove} className="hover:text-rose-600"><Trash2 className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={onClose} aria-label="Show all partners"><X className="h-4 w-4" /></Button>
          </div>
        </div>
        <button type="button" onClick={() => setShowItems((v) => !v)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:underline dark:text-amber-300">
          <Package className="h-3.5 w-3.5" />{showItems ? 'Hide' : 'Show'} items installed ({items.length})
        </button>
        {showItems && (
          items.length ? (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {items.map((i) => (
                <div key={i.key} className="flex justify-between gap-2 rounded-lg bg-[hsl(var(--color-muted))] px-3 py-1.5 text-xs">
                  <span className="truncate font-medium">{i.name}</span>
                  <span className="whitespace-nowrap text-muted-foreground">{i.quantity} {i.unit} · {formatINR(i.amount)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-muted-foreground">No items installed in the bills shown.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function TradersPartnersBillsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const partnerId = params.get('partner') || '';
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(params.get('due') ? 'partial,unpaid' : '');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const q = useDebounced(query.trim());

  const partners = useApi('/admin/traders/partners');
  const partnerItems = partners.data?.items || [];
  const selected = partnerItems.find((p) => p.id === partnerId);
  const { data, loading, error, reload } = useApi('/admin/traders/jobs', { q, status, paymentStatus: paymentStatus.includes(',') ? undefined : paymentStatus, partnerId, from, to });
  const dueOnly = paymentStatus.includes(',');
  const rows = dueOnly ? data?.items.filter((j) => j.balance > 0 && j.status !== 'cancelled') : data?.items;
  const page = useClientPage(rows);
  const s = dueOnly && rows
    ? rows.reduce((t, j) => ({ count: t.count + 1, billed: t.billed + j.total, paid: t.paid + j.paid, balance: t.balance + j.balance, profit: t.profit + j.profit }), { count: 0, billed: 0, paid: 0, balance: 0, profit: 0 })
    : data?.summary;

  const [partnerForm, setPartnerForm] = useState(params.get('add') === 'partner' ? { partner: null } : null);
  const [removingPartner, setRemovingPartner] = useState(null);
  const [paying, setPaying] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const selectPartner = (id) => setParams((prev) => {
    const next = new URLSearchParams(prev);
    next.delete('add');
    if (id) next.set('partner', id);
    else next.delete('partner');
    return next;
  }, { replace: true });
  const reloadAll = () => { reload(); partners.reload(); };
  const filtered = Boolean(q || status || paymentStatus || from || to);
  const clearFilters = () => { setQuery(''); setStatus(''); setPaymentStatus(''); setFrom(''); setTo(''); };

  const removeBill = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/traders/jobs/${deleting.id}`);
      toast.success('Bill deleted and parts returned to stock');
      setDeleting(null);
      reloadAll();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const removePartner = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/traders/partners/${removingPartner.id}`);
      toast.success('Partner removed');
      setRemovingPartner(null);
      selectPartner('');
      reloadAll();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => downloadCsv(selected ? `sanvi-bills-${selected.partnerCode}.csv` : 'sanvi-bills.csv', [
    { label: 'Bill', value: (j) => j.billNumber },
    { label: 'Date', value: (j) => formatDate(j.jobDate) },
    { label: 'Status', value: (j) => j.status },
    { label: 'Partner', value: (j) => j.client?.name },
    { label: 'Partner phone', value: (j) => j.client?.phone },
    { label: 'Site address', value: (j) => j.client?.address },
    { label: 'Items installed', value: (j) => j.items.map((i) => `${i.name} x${i.quantity}`).join('; ') },
    { label: 'Bill amount', value: (j) => j.total },
    { label: 'Paid', value: (j) => j.paid },
    { label: 'Due', value: (j) => j.balance },
    { label: 'Parts cost', value: (j) => j.itemsCost },
    { label: 'Profit', value: (j) => j.profit },
  ], rows || []);

  const newBill = () => navigate(selected ? `/traders/jobs/new?partner=${selected.id}` : '/traders/jobs/new');

  return (
    <div className="space-y-3">
      <TradersPageHeader
        title="Partners & bills"
        description="Your partners (clients) and every installation bill in one place — pick a partner to see their bills, items installed, paid and due."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={!rows?.length}><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" variant="outline" onClick={() => setPartnerForm({ partner: null })}><UserPlus className="h-4 w-4" />Add partner</Button>
            <Button size="sm" onClick={newBill}><Plus className="h-4 w-4" />New bill</Button>
          </>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <PartnerList
          partners={partnerItems}
          loading={partners.loading}
          selectedId={partnerId}
          onSelect={selectPartner}
          onAdd={() => setPartnerForm({ partner: null })}
        />

        <div className="min-w-0 space-y-3">
          {selected && (
            <PartnerCard
              partner={selected}
              rows={rows || []}
              onEdit={() => setPartnerForm({ partner: selected })}
              onRemove={() => setRemovingPartner(selected)}
              onNewBill={newBill}
              onClose={() => selectPartner('')}
            />
          )}

          <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
            <KpiCard label={`Billed · ${s?.count ?? 0} bills`} value={s ? formatINR(s.billed) : '—'} icon={ReceiptText} tone="amber" />
            <KpiCard label="Paid" value={s ? formatINR(s.paid) : '—'} icon={Wallet} tone="emerald" />
            <KpiCard label="Due" value={s ? formatINR(s.balance) : '—'} icon={IndianRupee} tone="rose" onClick={() => setPaymentStatus('partial,unpaid')} />
            <KpiCard label="Profit" value={s ? formatINR(s.profit) : '—'} icon={TrendingUp} tone="orange" />
          </div>

          <Card>
            <CardContent className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
                <Input placeholder="Bill, partner, item…" iconLeft={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} className="col-span-2 md:col-span-1" />
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">Any job status</option>
                  {JOB_STATUSES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
                </Select>
                <Select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                  <option value="">Any payment</option>
                  <option value="partial,unpaid">Money due</option>
                  {JOB_PAYMENT_STATUSES.map((st) => <option key={st} value={st}>{labelize(st)}</option>)}
                </Select>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
              </div>
              {filtered && (
                <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline dark:text-amber-300">
                  <X className="h-3.5 w-3.5" />Clear filters
                </button>
              )}

              <DataState
                loading={loading && !data}
                error={error}
                onRetry={reload}
                empty={!page.total}
                emptyTitle={selected ? `No bills for ${selected.name}` : 'No installation bills'}
                emptyDescription={filtered ? 'Try clearing the filters.' : 'Create a bill when items are installed at a partner’s site.'}
                emptyAction={<Button size="sm" variant="outline" onClick={newBill}>New bill</Button>}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill</TableHead>
                      <TableHead>{selected ? 'Items installed' : 'Partner & items installed'}</TableHead>
                      <TableHead className="text-right">Bill</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="w-32" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {page.rows.map((j) => (
                      <TableRow key={j.id} className={j.status === 'cancelled' ? 'opacity-60' : undefined}>
                        <TableCell className="whitespace-nowrap">
                          <Link to={`/traders/jobs/${j.id}`} className="font-medium text-amber-700 hover:underline dark:text-amber-300">{j.billNumber}</Link>
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{formatDate(j.jobDate)} <StatusBadge status={j.status} className="px-1.5 py-0 text-[10px]" /></p>
                        </TableCell>
                        <TableCell className="max-w-[18rem]">
                          {!selected && (
                            j.partnerId
                              ? <button type="button" onClick={() => selectPartner(j.partnerId.id)} className="line-clamp-1 text-left font-medium hover:underline">{j.client?.name}</button>
                              : <p className="line-clamp-1 font-medium">{j.client?.name}</p>
                          )}
                          <p className={cn('line-clamp-1', selected ? 'text-sm' : 'text-xs text-muted-foreground')}>{j.items.length ? j.items.map((i) => `${i.name} ×${i.quantity}`).join(', ') : 'Service only'}</p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-semibold">{formatINR(j.total)}</TableCell>
                        <TableCell className="whitespace-nowrap text-right text-emerald-600">{formatINR(j.paid)}</TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          {j.balance > 0 ? <span className="font-semibold text-rose-600">{formatINR(j.balance)}</span> : <StatusBadge status={j.status === 'cancelled' ? 'cancelled' : 'paid'} />}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right"><ProfitText value={j.profit} format={formatINR} /></TableCell>
                        <TableCell className="min-w-[9rem]">
                          <RowActions
                            actions={[
                              j.balance > 0 && j.status !== 'cancelled' && { icon: HandCoins, label: 'Receive payment', onClick: () => setPaying(j) },
                              { icon: FileText, label: 'Bill / PDF', onClick: () => navigate(`/traders/jobs/${j.id}`) },
                              { icon: Pencil, label: 'Edit', onClick: () => navigate(`/traders/jobs/${j.id}/edit`) },
                              { icon: Trash2, label: 'Delete', tone: 'danger', onClick: () => setDeleting(j) },
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
        </div>
      </div>

      <PartnerFormModal
        open={Boolean(partnerForm)}
        partner={partnerForm?.partner}
        onOpenChange={() => { setPartnerForm(null); selectPartner(partnerId); }}
        onSaved={(saved) => {
          partners.reload();
          reload();
          if (saved?.id) selectPartner(saved.id);
        }}
      />
      <JobPaymentModal job={paying} onOpenChange={() => setPaying(null)} onSaved={reloadAll} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={() => setDeleting(null)}
        title="Delete bill?"
        description={deleting ? `${deleting.billNumber} for ${deleting.client?.name} will be deleted and its parts returned to stock.` : ''}
        confirmLabel="Delete bill"
        destructive
        loading={busy}
        onConfirm={removeBill}
      />
      <ConfirmDialog
        open={Boolean(removingPartner)}
        onOpenChange={() => setRemovingPartner(null)}
        title="Remove partner?"
        description={removingPartner ? `${removingPartner.name} will be removed. Their bills stay as they are. Partners with money still due can only be marked inactive.` : ''}
        confirmLabel="Remove partner"
        destructive
        loading={busy}
        onConfirm={removePartner}
      />
    </div>
  );
}
