import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';
import { apiError, mediaUrl, uploadImage } from '../../lib/api';

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 3;

/** Shrinks large photos (phone cameras) to `maxSide` px JPEG before upload. */
async function resizeImage(file, maxSide) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 1024 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    const transparent = file.type === 'image/png' || file.type === 'image/webp';
    if (!transparent) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const type = transparent ? file.type : 'image/jpeg';
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.85));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + (type === 'image/jpeg' ? '.jpg' : type === 'image/png' ? '.png' : '.webp'), { type });
  } catch {
    return file;
  }
}

export default function ImageUpload({ value, onChange, folder, shape = 'circle', maxSide = 800, fallback, disabled }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const pick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ACCEPT.includes(file.type)) return setError('Choose a JPG, PNG or WEBP image');
    setError('');
    setUploading(true);
    try {
      const ready = await resizeImage(file, maxSide);
      if (ready.size > MAX_MB * 1024 * 1024) throw new Error(`Image must be smaller than ${MAX_MB} MB`);
      onChange(await uploadImage(ready, folder));
    } catch (err) {
      setError(err.response ? apiError(err) : err.message || apiError(err));
    } finally {
      setUploading(false);
    }
  };

  const src = mediaUrl(value);

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden border border-dashed border-[hsl(var(--color-border-premium))] bg-[hsl(var(--color-muted))] text-muted-foreground transition hover:border-[hsl(var(--color-primary-blue))]',
          shape === 'circle' ? 'h-20 w-20 rounded-full' : shape === 'square' ? 'h-20 w-20 rounded-2xl' : 'h-24 w-40 rounded-xl'
        )}
        aria-label={value ? 'Change image' : 'Upload image'}
      >
        {src ? (
          <img src={src} alt="" className={cn('h-full w-full', shape === 'square' ? 'bg-white object-contain p-1' : 'object-cover')} />
        ) : fallback ? (
          <span className="text-lg font-semibold">{fallback}</span>
        ) : (
          <ImagePlus className="h-6 w-6" />
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
        )}
      </button>
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={disabled || uploading}>
            <Upload className="h-3.5 w-3.5" />
            {uploading ? 'Uploading…' : value ? 'Change' : 'Upload'}
          </Button>
          {value && !uploading && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange('')} disabled={disabled} className="text-rose-600">
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          )}
        </div>
        <p className={cn('text-[11px]', error ? 'font-medium text-destructive' : 'text-muted-foreground')}>
          {error || 'JPG, PNG or WEBP. Large photos are resized automatically.'}
        </p>
      </div>
      <input ref={inputRef} type="file" accept={ACCEPT.join(',')} className="hidden" onChange={pick} />
    </div>
  );
}
