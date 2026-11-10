import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  CheckCircle2, CircleDashed, ClipboardPaste, Copy, ExternalLink, ImagePlus, Images, Library, Pencil, RotateCcw, Search, Sparkles, Trash2, UploadCloud, Wand2,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import KpiCard from '../../components/ui/KpiCard';
import { FormBanner } from '../../components/ui/FormBanner';
import PageHeader from '../../components/admin/PageHeader';
import DataState from '../../components/admin/DataState';
import PillTabs from '../../components/admin/PillTabs';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api, { apiError, mediaUrl, uploadImage } from '../../lib/api';
import { cn } from '../../lib/utils';
import { IMAGE_SHAPES, SITE_IMAGES, SITE_IMAGE_KEYS, bundledSrc, imagesByPage, siteImagePrompt } from '../../constants/siteImages';
import useSiteImageStore from '../../stores/siteImageStore';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const STATUS = [
  { value: 'all', label: 'All' },
  { value: 'empty', label: 'Starter / empty' },
  { value: 'live', label: 'Your photos' },
];
const SOURCE_LABEL = { upload: 'Uploaded', generated: 'AI generated', library: 'From library' };
const ICON_BTN = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-[hsl(var(--color-muted))] hover:text-foreground disabled:pointer-events-none disabled:opacity-40';

function pastedImage(clipboard) {
  const item = [...(clipboard?.items || [])].find((entry) => entry.kind === 'file' && TYPES.includes(entry.type));
  return item ? item.getAsFile() : null;
}

/** Copies text; falls back to a hidden textarea where the Clipboard API is unavailable (e.g. plain-http hosts). */
async function copyText(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand('copy');
  area.remove();
  if (!ok) throw new Error('copy failed');
}

function SlotCard({ slotKey, row, busy, selected, canGenerate, onSelect, onFile, onCopyPrompt, onGenerate, onLibrary, onAlt, onRemove }) {
  const spec = SITE_IMAGES[slotKey];
  const shape = IMAGE_SHAPES[spec.shape];
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const src = row ? mediaUrl(row.url) : bundledSrc(slotKey);
  const pick = () => inputRef.current?.click();

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border border-[hsl(var(--color-border-premium))] bg-[hsl(var(--color-card-bg))] shadow-sm transition hover:shadow-lg',
        (over || selected) && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-background'
      )}
      onMouseEnter={() => onSelect(slotKey)}
      onClick={() => onSelect(slotKey)}
      onDragOver={(event) => { event.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file) onFile(slotKey, file);
      }}
    >
      <div className={cn('group relative overflow-hidden bg-[hsl(var(--color-muted)/0.5)]', shape.ratio)}>
        {src ? (
          <img src={src} alt={row?.alt || spec.alt} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <button
            type="button"
            onClick={pick}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-blue-50 via-white to-amber-50 text-center outline-dashed outline-2 -outline-offset-[10px] outline-blue-200 transition hover:from-blue-100 dark:from-blue-950/30 dark:via-transparent dark:to-amber-950/20 dark:outline-blue-900"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm ring-1 ring-blue-100 dark:bg-blue-950 dark:ring-blue-900">
              <ImagePlus className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold">Drop, paste (Ctrl+V) or click to upload</span>
            <span className="text-[11px] text-muted-foreground">or copy its prompt into ChatGPT</span>
          </button>
        )}
        <span className={cn(
          'pointer-events-none absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm backdrop-blur',
          row ? 'bg-emerald-600/90 text-white' : src ? 'bg-sky-600/90 text-white' : 'bg-amber-100/95 text-amber-800 dark:bg-amber-900/80 dark:text-amber-100'
        )}
        >
          {row || src ? <CheckCircle2 className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
          {row ? `Live · ${SOURCE_LABEL[row.source] || 'Uploaded'}` : src ? 'Starter photo — upload to replace' : 'Empty — page shows its icon design'}
        </span>
        {busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/85 backdrop-blur-sm">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-sm font-semibold">{busy}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-[hsl(var(--color-border-premium))] px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-bold" title={spec.section}>{spec.section}</p>
          <p className="truncate text-[11px] text-muted-foreground">{shape.label} · <span className="font-mono">{slotKey}</span></p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button type="button" onClick={pick} disabled={Boolean(busy)} title={row ? 'Replace with an upload' : 'Upload'} aria-label={`Upload ${slotKey}`} className={cn(ICON_BTN, 'bg-blue-600 text-white hover:bg-blue-500 hover:text-white')}>
            <UploadCloud className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => onCopyPrompt(slotKey)} title="Copy prompt for ChatGPT" aria-label={`Copy prompt for ${slotKey}`} className={cn(ICON_BTN, 'text-violet-600')}>
            <Copy className="h-4 w-4" />
          </button>
          {canGenerate && (
            <button type="button" onClick={() => onGenerate(slotKey)} disabled={Boolean(busy)} title="Generate from a prompt" aria-label={`Generate ${slotKey}`} className={cn(ICON_BTN, 'text-violet-600')}>
              <Wand2 className="h-4 w-4" />
            </button>
          )}
          <button type="button" onClick={() => onLibrary(slotKey)} disabled={Boolean(busy)} title="Use an image from the library" aria-label={`Library for ${slotKey}`} className={ICON_BTN}>
            <Library className="h-4 w-4" />
          </button>
          {row && (
            <>
              <button type="button" onClick={() => onAlt(slotKey)} disabled={Boolean(busy)} title="Edit description (alt text)" aria-label={`Alt text for ${slotKey}`} className={ICON_BTN}>
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => onRemove(slotKey)} disabled={Boolean(busy)} title="Remove image" aria-label={`Remove ${slotKey}`} className={cn(ICON_BTN, 'hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40')}>
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) onFile(slotKey, file);
        }}
      />
    </article>
  );
}

export default function WebsiteImagesPage() {
  const [rows, setRows] = useState({});
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState('all');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState({});
  const [selected, setSelected] = useState('');
  const [generateFor, setGenerateFor] = useState(null);
  const [libraryFor, setLibraryFor] = useState('');
  const [altFor, setAltFor] = useState(null);
  const [removeFor, setRemoveFor] = useState('');
  const [saving, setSaving] = useState(false);
  const putPublic = useSiteImageStore((state) => state.put);
  const removePublic = useSiteImageStore((state) => state.remove);
  const groups = useMemo(() => imagesByPage(), []);
  const selectedRef = useRef('');
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/site-images')
      .then(({ data }) => {
        setRows(Object.fromEntries((data.items || []).map((row) => [row.key, row])));
        setEnabled(Boolean(data.generationEnabled));
        setError('');
      })
      .catch((err) => setError(apiError(err, 'Could not load website images')))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const setBusyFor = (key, label) => setBusy((current) => {
    const next = { ...current };
    if (label) next[key] = label;
    else delete next[key];
    return next;
  });

  const saved = (image) => {
    setRows((current) => ({ ...current, [image.key]: image }));
    putPublic(image.key, image);
  };

  const onFile = async (key, file) => {
    if (!TYPES.includes(file.type)) return toast.error('Use a PNG, JPG or WebP image');
    if (file.size > MAX_BYTES) return toast.error('Image must be 5 MB or smaller');
    setBusyFor(key, 'Uploading…');
    try {
      const url = await uploadImage(file, 'site');
      const { data } = await api.put(`/admin/site-images/${key}`, { url, alt: rows[key]?.alt || '', prompt: rows[key]?.prompt || '', source: 'upload' });
      saved(data.image);
      toast.success('Image is live on the website');
    } catch (err) {
      toast.error(apiError(err, 'Could not upload the image'));
    } finally {
      setBusyFor(key, '');
    }
    return undefined;
  };
  fileRef.current = onFile;
  selectedRef.current = selected;

  useEffect(() => {
    const onPaste = (event) => {
      if (/INPUT|TEXTAREA/.test(event.target?.tagName || '')) return;
      const file = pastedImage(event.clipboardData);
      if (!file) return;
      event.preventDefault();
      if (!selectedRef.current) {
        toast.error('Point at an image card first, then paste');
        return;
      }
      fileRef.current(selectedRef.current, file);
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, []);

  const openGenerate = (key) => setGenerateFor({ key, prompt: rows[key]?.prompt || siteImagePrompt(key), alt: rows[key]?.alt || '' });

  const generate = async () => {
    const { key, prompt, alt } = generateFor;
    setGenerateFor(null);
    setBusyFor(key, 'Generating… up to a minute');
    try {
      const { data } = await api.post(`/admin/site-images/${key}/generate`, { prompt, alt }, { timeout: 180000 });
      saved(data.image);
      toast.success('Generated image is live on the website');
    } catch (err) {
      toast.error(apiError(err, 'Could not generate the image'));
    } finally {
      setBusyFor(key, '');
    }
  };

  const copyPrompt = async (text) => {
    try {
      await copyText(text);
      toast.success('Prompt copied — paste it into ChatGPT, then paste the image back on the card');
    } catch {
      toast.error('Could not copy the prompt. Try again.');
    }
  };
  const copySlotPrompt = (key) => copyPrompt(rows[key]?.prompt || siteImagePrompt(key));

  const library = useMemo(() => {
    const seen = new Map();
    for (const row of Object.values(rows)) if (!seen.has(row.url)) seen.set(row.url, row);
    return [...seen.values()];
  }, [rows]);

  const pickFromLibrary = async (row) => {
    const key = libraryFor;
    setLibraryFor('');
    setBusyFor(key, 'Saving…');
    try {
      const { data } = await api.put(`/admin/site-images/${key}`, { url: row.url, alt: rows[key]?.alt || row.alt || '', prompt: row.prompt || '', source: 'library' });
      saved(data.image);
      toast.success('Image is live on the website');
    } catch (err) {
      toast.error(apiError(err, 'Could not use that image'));
    } finally {
      setBusyFor(key, '');
    }
  };

  const saveAlt = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/admin/site-images/${altFor.key}`, { alt: altFor.value });
      saved(data.image);
      toast.success('Description saved');
      setAltFor(null);
    } catch (err) {
      toast.error(apiError(err, 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await api.delete(`/admin/site-images/${removeFor}`);
      setRows((current) => {
        const next = { ...current };
        delete next[removeFor];
        return next;
      });
      removePublic(removeFor);
      toast.success('Image removed');
      setRemoveFor('');
    } catch (err) {
      toast.error(apiError(err, 'Could not remove'));
    } finally {
      setSaving(false);
    }
  };

  const needle = query.trim().toLowerCase();
  const visible = groups
    .filter((group) => page === 'all' || group.page === page)
    .map((group) => ({
      ...group,
      shown: group.keys.filter((key) => {
        if (status === 'live' && !rows[key]) return false;
        if (status === 'empty' && rows[key]) return false;
        return !needle || key.includes(needle) || SITE_IMAGES[key].section.toLowerCase().includes(needle);
      }),
    }))
    .filter((group) => group.shown.length);
  const live = SITE_IMAGE_KEYS.filter((key) => rows[key]).length;
  const generated = Object.values(rows).filter((row) => row.source === 'generated').length;
  const pageTabs = [{ value: 'all', label: `All pages · ${live}/${SITE_IMAGE_KEYS.length}` }, ...groups.map((g) => ({ value: g.page, label: `${g.page} · ${g.keys.filter((k) => rows[k]).length}/${g.keys.length}` }))];

  return (
    <div className="space-y-3">
      <PageHeader
        title="Website images"
        description="Photos for every public page — Home, Courses, CCTV, Products, About, Contact, Admission and the Silicon / Sanvi pages. Upload, paste or generate an image for each spot; it goes live straight away."
        actions={<a href="/" target="_blank" rel="noreferrer"><Button size="sm" variant="outline"><ExternalLink className="h-4 w-4" />Open website</Button></a>}
      />

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label={`Your photos · of ${SITE_IMAGE_KEYS.length} spots`} value={loading ? '—' : live} icon={Images} tone="emerald" onClick={() => setStatus('live')} />
        <KpiCard label="Using starter photo" value={loading ? '—' : SITE_IMAGE_KEYS.length - live} icon={CircleDashed} tone="amber" onClick={() => setStatus('empty')} />
        <KpiCard label="AI generated" value={loading ? '—' : generated} icon={Sparkles} tone="violet" />
        <KpiCard label="Prompt generation" value={loading ? '—' : enabled ? 'Ready' : 'Not set up'} icon={Wand2} tone={enabled ? 'blue' : 'slate'} />
      </div>

      {!loading && !enabled && (
        <FormBanner tone="info" title="Generating from a prompt needs one setting on the server">
          Add <code className="rounded bg-[hsl(var(--color-muted))] px-1">OPENAI_API_KEY=…</code> to <code className="rounded bg-[hsl(var(--color-muted))] px-1">backend/.env</code> and restart the backend to generate images here. Until then, click
          <Copy className="mx-1 inline h-3.5 w-3.5" />on any card to copy its prompt, paste it into ChatGPT, then copy the image and paste it on the card (Ctrl+V).
        </FormBanner>
      )}

      <div className="space-y-3 rounded-2xl border border-[hsl(var(--color-border-premium))] bg-[hsl(var(--color-card-bg))] p-3">
        <PillTabs tabs={pageTabs} value={page} onChange={setPage} />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <PillTabs tabs={STATUS} value={status} onChange={setStatus} />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a section…" iconLeft={<Search className="h-4 w-4" />} className="sm:max-w-xs" aria-label="Search images" />
        </div>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ClipboardPaste className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Point at a card and press Ctrl+V / ⌘V to paste a copied image, or drop a file on it. JPG, PNG or WebP up to 5 MB. Spots without your own photo show a built-in starter photo; removing your photo brings the starter back.
        </p>
      </div>

      <DataState loading={loading} error={error} onRetry={load} empty={!visible.length} emptyTitle="Nothing matches this filter" rows={6}>
        <div className="space-y-6">
          {visible.map((group) => (
            <section key={group.page} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold">{group.page} page <span className="text-xs font-medium text-muted-foreground">· {group.keys.filter((k) => rows[k]).length} of {group.keys.length} live</span></h2>
                <a href={group.path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">View page<ExternalLink className="h-3 w-3" /></a>
              </div>
              <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.shown.map((key) => (
                  <SlotCard
                    key={key}
                    slotKey={key}
                    row={rows[key]}
                    busy={busy[key]}
                    selected={selected === key}
                    canGenerate={enabled}
                    onSelect={setSelected}
                    onFile={onFile}
                    onCopyPrompt={copySlotPrompt}
                    onGenerate={openGenerate}
                    onLibrary={setLibraryFor}
                    onAlt={(target) => setAltFor({ key: target, value: rows[target]?.alt || '' })}
                    onRemove={setRemoveFor}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </DataState>

      <Modal
        open={Boolean(generateFor)}
        onOpenChange={(open) => !open && setGenerateFor(null)}
        title="Generate from a prompt"
        description={generateFor ? SITE_IMAGES[generateFor.key].section : ''}
        className="max-w-2xl"
        footer={generateFor && (
          <>
            <Button variant="outline" size="sm" onClick={() => setGenerateFor({ ...generateFor, prompt: siteImagePrompt(generateFor.key) })}><RotateCcw className="h-4 w-4" />Suggested prompt</Button>
            <Button variant="outline" size="sm" onClick={() => copyPrompt(generateFor.prompt)}><Copy className="h-4 w-4" />Copy for ChatGPT</Button>
            <Button size="sm" onClick={generate} disabled={!enabled || generateFor.prompt.trim().length < 10} title={enabled ? undefined : 'Add OPENAI_API_KEY to backend/.env first'}>
              <Wand2 className="h-4 w-4" />Generate & publish
            </Button>
          </>
        )}
      >
        {generateFor && (
          <div className="space-y-3">
            <div>
              <label htmlFor="gen-prompt" className="mb-1.5 block text-sm font-medium">Prompt — describe the photo you want</label>
              <Textarea id="gen-prompt" rows={11} value={generateFor.prompt} onChange={(e) => setGenerateFor({ ...generateFor, prompt: e.target.value })} className="font-mono text-[12.5px] leading-5" />
              <p className="mt-1 text-[11px] text-muted-foreground">{IMAGE_SHAPES[SITE_IMAGES[generateFor.key].shape].label} · {IMAGE_SHAPES[SITE_IMAGES[generateFor.key].shape].size} px. Edit the Scene line to change what is shown.</p>
            </div>
            <div>
              <label htmlFor="gen-alt" className="mb-1.5 block text-sm font-medium">Description (alt text, optional)</label>
              <Input id="gen-alt" maxLength={160} value={generateFor.alt} placeholder={SITE_IMAGES[generateFor.key].alt} onChange={(e) => setGenerateFor({ ...generateFor, alt: e.target.value })} />
            </div>
            {!enabled && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">Generation is not set up on the server yet. Copy the prompt into ChatGPT, then paste the image on the card.</p>}
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(libraryFor)}
        onOpenChange={(open) => !open && setLibraryFor('')}
        title="Choose from the library"
        description={libraryFor ? `Use an image you already added for: ${SITE_IMAGES[libraryFor].section}` : ''}
        className="max-w-3xl"
      >
        {library.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {library.map((row) => (
              <button key={row.url} type="button" onClick={() => pickFromLibrary(row)} className="group overflow-hidden rounded-xl border border-[hsl(var(--color-border-premium))] text-left transition hover:ring-2 hover:ring-blue-500">
                <img src={mediaUrl(row.url)} alt={row.alt || ''} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                <span className="block truncate px-2 py-1.5 text-[11px] text-muted-foreground">{SITE_IMAGES[row.key]?.section || row.key}</span>
              </button>
            ))}
          </div>
        ) : <p className="py-8 text-center text-sm text-muted-foreground">No images yet. Upload or generate one first.</p>}
      </Modal>

      <Modal
        open={Boolean(altFor)}
        onOpenChange={(open) => !open && setAltFor(null)}
        title="Image description"
        description="Read by screen readers and search engines. Leave empty to use the default."
        footer={(
          <>
            <Button variant="outline" size="sm" onClick={() => setAltFor(null)}>Cancel</Button>
            <Button size="sm" onClick={saveAlt} loading={saving}>Save</Button>
          </>
        )}
      >
        {altFor && <Input maxLength={160} value={altFor.value} placeholder={SITE_IMAGES[altFor.key].alt} onChange={(e) => setAltFor({ ...altFor, value: e.target.value })} aria-label="Alt text" />}
      </Modal>

      <ConfirmDialog
        open={Boolean(removeFor)}
        onOpenChange={(open) => !open && setRemoveFor('')}
        title="Remove this image?"
        description="It comes off the website and the spot goes back to its built-in icon design."
        confirmLabel="Remove"
        destructive
        loading={saving}
        onConfirm={remove}
      >
        {removeFor && rows[removeFor] && <img src={mediaUrl(rows[removeFor].url)} alt="" className="max-h-56 w-full rounded-lg object-contain" />}
      </ConfirmDialog>
    </div>
  );
}
