import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import { SOCIAL_NETWORKS } from '../../constants/site';
import { cn } from '../../lib/utils';

const ICONS = { facebook: Facebook, instagram: Instagram, youtube: Youtube, x: Twitter, linkedin: Linkedin };

export function SocialLinks({ social, className, itemClassName }) {
  const networks = SOCIAL_NETWORKS.filter((network) => social?.[network.key]);
  if (!networks.length) return null;
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {networks.map((network) => {
        const Icon = ICONS[network.key];
        return (
          <a
            key={network.key}
            href={social[network.key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={network.label}
            title={network.label}
            className={cn('flex h-9 w-9 items-center justify-center rounded-full transition duration-300 hover:-translate-y-0.5', itemClassName)}
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}
    </div>
  );
}

export function AddressText({ info, className }) {
  if (!info.mapUrl) return <span className={className}>{info.address}</span>;
  return (
    <a href={info.mapUrl} target="_blank" rel="noopener noreferrer" className={cn('hover:text-white hover:underline', className)}>
      {info.address}
    </a>
  );
}
