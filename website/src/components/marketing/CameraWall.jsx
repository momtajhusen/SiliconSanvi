import { Cctv, Smartphone, MoonStar, DoorOpen, Car, Store, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

const FEEDS = [
  { id: '01', label: 'Main gate', icon: DoorOpen },
  { id: '02', label: 'Parking', icon: Car, night: true },
  { id: '03', label: 'Counter', icon: Store },
  { id: '04', label: 'Classroom', icon: Users },
];

function Feed({ feed }) {
  const Icon = feed.icon;
  return (
    <div
      className={cn(
        'relative aspect-video overflow-hidden rounded-xl ring-1 ring-white/10',
        feed.night ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-black' : 'bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950'
      )}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)', backgroundSize: '14px 14px' }}
        aria-hidden="true"
      />
      <Icon className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-white/25" strokeWidth={1.4} />
      <span className="absolute left-2 top-2 rounded bg-black/40 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-white/85">
        CAM {feed.id} · {feed.label}
      </span>
      <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 text-[9px] font-bold text-white">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
        REC
      </span>
      {feed.night && (
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 text-[9px] font-semibold text-blue-100">
          <MoonStar className="h-2.5 w-2.5" />
          Night vision
        </span>
      )}
      <span className="absolute bottom-2 right-2 font-mono text-[9px] text-white/60">24×7</span>
    </div>
  );
}

export default function CameraWall({ className }) {
  return (
    <div className={cn('relative px-2 py-6 sm:px-6', className)}>
      <div className="absolute inset-4 rounded-[2rem] bg-gradient-to-br from-amber-400/30 via-orange-400/15 to-blue-700/30 blur-2xl" aria-hidden="true" />
      <div className="relative rounded-[1.6rem] border border-white/15 bg-slate-950/90 p-3 shadow-2xl sm:p-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-white">
            <span className="brand-tile brand-tile-sanvi h-7 w-7 rounded-lg">
              <Cctv className="relative h-3.5 w-3.5" />
            </span>
            <span><span className="brand-word brand-text-sanvi-light">SANVI</span> CCTV · Live</span>
          </span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-blue-100">4 cameras online</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {FEEDS.map((feed) => (
            <Feed key={feed.id} feed={feed} />
          ))}
        </div>
      </div>
      <div className="mkt-float absolute -bottom-1 -right-1 hidden items-center gap-3 rounded-2xl border border-white/70 bg-white/95 px-3.5 py-2.5 text-slate-900 shadow-xl sm:flex">
        <span className="brand-tile brand-tile-sanvi h-9 w-9 rounded-xl">
          <Smartphone className="relative h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-semibold text-slate-400">Watch anywhere</p>
          <p className="text-sm font-bold">Live on your phone</p>
        </div>
      </div>
    </div>
  );
}
