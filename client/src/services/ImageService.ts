export type IconKey =
  | 'trophy'
  | 'battle'
  | 'cards'
  | 'shop'
  | 'history'
  | 'settings'
  | 'skull'
  | 'win'
  | 'phantom'
  | 'discord'
  | 'phone'
  | 'email'
  | 'gift'
  | 'rocket'
  | 'tip'
  | 'gbux'
  | 'pack_common'
  | 'pack_rare'
  | 'pack_legendary'
  | 'sword'
  | 'shield'
  | 'logout'
  | 'user'
  | 'timer'
  | 'fire';

const STATIC_ICONS: Partial<Record<IconKey, string>> = {
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

export async function generateIcon(key: IconKey): Promise<string> {
  const path = STATIC_ICONS[key];
  if (path) return path;
  throw new Error(`No static icon for: ${key}`);
}

export function getCachedIcon(key: IconKey): string | null {
  return STATIC_ICONS[key] ?? null;
}

export function preloadIcons(_keys: IconKey[]) {
}
