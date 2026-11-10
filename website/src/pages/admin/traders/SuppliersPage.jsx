import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FileBadge, IndianRupee, Pencil, Phone, Plus, Search, ShoppingCart, Trash2, Truck, UserRound } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import KpiCard from '../../../components/ui/KpiCard';
import DataState from '../../../components/admin/DataState';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import StatusBadge from '../../../components/admin/StatusBadge';
import { TradersPageHeader } from '../../../components/traders/TradersKit';
import SupplierFormModal from '../../../components/traders/SupplierFormModal';
import { formatDate, formatINR, initials } from '../../../lib/format';
import { useApi, useDebounced } from '../../../hooks/useApi';
import api, { apiError } from '../../../lib/api';

function Stat({ label, value, tone }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`truncate text-sm font-bold ${tone || ''}`}>{value}</p>
    </div>
  );
}

export default function TradersSuppliersPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const q = useDebounced(query.trim());
  const { data, loading, error, reload } = useApi('/admin/traders/suppliers', { q });
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const items = data?.items || [];
  const total = (key) => items.reduce((t, s) => t + (s.stats[key] || 0), 0);

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/traders/suppliers/${deleting.id}`);
      toast.success('Supplier removed');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <TradersPageHeader
        title="Suppliers"
        description="Wholesalers and distributors you buy stock from, with what you bought, paid and still owe each one."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Add supplier</Button>
            <Button size="sm" onClick={() => navigate('/traders/purchases/new')}><ShoppingCart className="h-4 w-4" />Record purchase</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
        <KpiCard label={`${items.length} suppliers`} value={formatINR(total('purchased'))} icon={Truck} tone="amber" />
        <KpiCard label="Paid to suppliers" value={formatINR(total('paid'))} icon={IndianRupee} tone="emerald" />
        <KpiCard label="You still owe" value={formatINR(total('balance'))} icon={IndianRupee} tone="rose" onClick={() => navigate('/traders/purchases?due=1')} />
      </div>

      <Input placeholder="Search name, phone, GSTIN…" iconLeft={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />

      <DataState loading={loading && !data} error={error} onRetry={reload} empty={!items.length} emptyTitle="No suppliers yet" emptyDescription="Add the shops and distributors you buy stock from." emptyAction={<Button size="sm" variant="outline" onClick={() => setAdding(true)}>Add a supplier</Button>}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((s) => (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/traders/purchases?supplier=${s.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/traders/purchases?supplier=${s.id}`)}
              className="premium-card group relative cursor-pointer overflow-hidden p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-stone-500 to-amber-600" />
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-stone-600 to-amber-700 text-sm font-bold text-white">{initials(s.name)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{s.name}</p>
                    {s.status !== 'active' && <StatusBadge status={s.status} />}
                  </div>
                  <p className="text-xs text-muted-foreground">{s.supplierCode}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {s.phone && <a href={`tel:${s.phone}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 hover:text-foreground"><Phone className="h-3 w-3" />{s.phone}</a>}
                    {s.contactPerson && <span className="inline-flex items-center gap-1"><UserRound className="h-3 w-3" />{s.contactPerson}</span>}
                    {s.gstin && <span className="inline-flex items-center gap-1"><FileBadge className="h-3 w-3" />{s.gstin}</span>}
                  </div>
                </div>
                <div className="flex gap-0.5 opacity-70 group-hover:opacity-100">
                  <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(s); }} className="rounded-lg p-1.5 hover:bg-[hsl(var(--color-muted))]" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setDeleting(s); }} className="rounded-lg p-1.5 hover:bg-rose-500/10 hover:text-rose-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl bg-[hsl(var(--color-muted))] p-2.5">
                <Stat label="Bills" value={s.stats.bills} />
                <Stat label="Bought" value={formatINR(s.stats.purchased)} />
                <Stat label="Paid" value={formatINR(s.stats.paid)} tone="text-emerald-600" />
                <Stat label="Owed" value={formatINR(s.stats.balance)} tone={s.stats.balance > 0 ? 'text-rose-600' : ''} />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">{s.stats.lastPurchase ? `Last purchase ${formatDate(s.stats.lastPurchase)}` : 'No purchases yet'}</p>
            </div>
          ))}
        </div>
      </DataState>
      <p className="text-xs text-muted-foreground">Purchases by supplier for any period are in the <Link to="/traders/reports?tab=purchases" className="font-medium text-amber-700 hover:underline dark:text-amber-300">purchase report</Link>.</p>

      <SupplierFormModal open={adding || Boolean(editing)} supplier={editing} onOpenChange={() => { setAdding(false); setEditing(null); }} onSaved={reload} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={() => setDeleting(null)}
        title="Remove supplier?"
        description={deleting ? `${deleting.name} will be removed. Suppliers with purchase bills can only be marked inactive.` : ''}
        confirmLabel="Remove supplier"
        destructive
        loading={busy}
        onConfirm={remove}
      />
    </div>
  );
}
