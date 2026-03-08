import React from 'react';
import type { IconKey } from '../services/ImageService';

interface GameIconProps {
  icon: IconKey;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

const ICON_PATHS: Partial<Record<IconKey, string>> = {
  trophy:        '/icons/trophy.png',
  battle:        '/icons/battle.png',
  sword:         '/icons/battle.png',
  win:           '/icons/win.png',
  skull:         '/icons/skull.png',
  cards:         '/icons/cards.png',
  shop:          '/icons/shop.png',
  shield:        '/icons/shield.png',
  history:       '/icons/history.png',
  user:          '/icons/user.png',
  settings:      '/icons/settings.png',
  gift:          '/icons/gift.png',
  timer:         '/icons/timer.png',
  logout:        '/icons/logout.png',
  fire:          '/icons/fire.png',
  tip:           '/icons/tip.png',
  phantom:       '/icons/phantom.svg',
  discord:       '/icons/discord.svg',
  phone:         '/icons/phone.svg',
  email:         '/icons/email.svg',
  rocket:        '/icons/rocket.svg',
};

import {
  Coins, Package, PackagePlus, Crown, Settings
} from 'lucide-react';

type LucideIcon = React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;

const FALLBACK_MAP: Record<string, { Icon: LucideIcon; color: string }> = {
  gbux:           { Icon: Coins,       color: '#ffd700' },
  pack_common:    { Icon: Package,     color: '#22c55e' },
  pack_rare:      { Icon: PackagePlus, color: '#a855f7' },
  pack_legendary: { Icon: Crown,       color: '#ffd700' },
};

export default function GameIcon({ icon, size = 32, className = '', style, alt }: GameIconProps) {
  const iconPath = ICON_PATHS[icon];

  if (iconPath) {
    return (
      <img
        src={iconPath}
        alt={alt ?? icon}
        width={size}
        height={size}
        className={className}
        style={{ display: 'inline-block', flexShrink: 0, objectFit: 'contain', ...style }}
      />
    );
  }

  const fallback = FALLBACK_MAP[icon];
  if (fallback) {
    const { Icon, color } = fallback;
    const padding = Math.round(size * 0.15);
    return (
      <span
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          borderRadius: '30%',
          background: `${color}22`,
          border: `2px solid ${color}55`,
          flexShrink: 0,
          padding,
          ...style,
        }}
        title={alt ?? icon}
      >
        <Icon size={size - padding * 2 - 4} style={{ color, filter: `drop-shadow(0 0 4px ${color}88)` }} />
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '30%',
        background: '#39ff1422',
        border: '2px solid #39ff1455',
        flexShrink: 0,
        ...style,
      }}
      title={alt ?? icon}
    >
      <Settings size={size - 8} style={{ color: '#39ff14' }} />
    </span>
  );
}
