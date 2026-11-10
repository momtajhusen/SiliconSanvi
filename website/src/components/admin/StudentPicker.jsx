import { useState } from 'react';
import { Search, X } from 'lucide-react';
import Input from '../ui/Input';
import { Loader } from '../ui/Loader';
import { useApi, useDebounced } from '../../hooks/useApi';

export default function StudentPicker({ value, onChange, autoFocus }) {
  const [query, setQuery] = useState('');
  const debounced = useDebounced(query.trim());
  const { data, loading } = useApi(value ? null : '/admin/students', { q: debounced });
  const matches = (data?.items || []).slice(0, 8);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-[hsl(var(--color-border-premium))] bg-[hsl(var(--color-muted))]/40 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{value.name}</p>
          <p className="text-xs text-muted-foreground">{value.studentId} · {value.phone}</p>
        </div>
        <button type="button" onClick={() => onChange(null)} className="rounded p-1 text-muted-foreground hover:bg-[hsl(var(--color-muted))]" aria-label="Change student">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Input
        autoFocus={autoFocus}
        placeholder="Search by name, phone or student ID…"
        iconLeft={<Search className="h-4 w-4" />}
        iconRight={loading ? <Loader size="sm" /> : null}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="max-h-56 overflow-y-auto rounded-lg border border-[hsl(var(--color-border-premium))]">
        {matches.length === 0 ? (
          <p className="px-3 py-3 text-xs text-muted-foreground">{loading ? 'Searching…' : 'No students found'}</p>
        ) : (
          matches.map((student) => (
            <button
              key={student.id}
              type="button"
              onClick={() => onChange(student)}
              className="flex w-full items-center justify-between gap-2 border-b border-[hsl(var(--color-border-premium))] px-3 py-2 text-left last:border-0 hover:bg-[hsl(var(--color-muted))]/60"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{student.name}</span>
                <span className="block text-xs text-muted-foreground">{student.studentId} · {student.phone}</span>
              </span>
              {student.balance > 0 && <span className="shrink-0 text-xs font-semibold text-amber-600">Due ₹{student.balance}</span>}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
