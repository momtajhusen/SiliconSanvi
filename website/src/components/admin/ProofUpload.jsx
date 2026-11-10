import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ExternalLink, Paperclip, X } from 'lucide-react';
import Button from '../ui/Button';
import { apiError, mediaUrl, uploadFile } from '../../lib/api';

const MAX_MB = 5;

/** Attach a screenshot / PDF (eSewa / Khalti / Fonepay screenshot, cheque photo, bank voucher). `value` is the `/uploads/...` path. */
export default function ProofUpload({ value, onChange, folder = 'payments', disabled }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const pick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_MB} MB`);
      return;
    }
    setUploading(true);
    try {
      onChange(await uploadFile(file, folder));
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={pick} />
      {value ? (
        <>
          <a
            href={mediaUrl(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-[14rem] items-center gap-1.5 truncate rounded-lg border border-[hsl(var(--color-border-premium))] px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            {/\.pdf$/i.test(value) ? 'View PDF' : 'View proof'}
          </a>
          <Button type="button" size="sm" variant="ghost" onClick={() => inputRef.current?.click()} disabled={disabled || uploading} loading={uploading}>Change</Button>
          <Button type="button" size="sm" variant="ghost" className="text-rose-600" onClick={() => onChange('')} disabled={disabled || uploading} aria-label="Remove proof">
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={disabled || uploading} loading={uploading}>
          <Paperclip className="h-4 w-4" />Attach screenshot / PDF
        </Button>
      )}
    </div>
  );
}
