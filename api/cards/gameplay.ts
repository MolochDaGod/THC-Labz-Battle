import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Public play catalog from Codex. Avoid bundling the huge generated card DB in this lambda. */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=60');
  try {
    const [bb, cat] = await Promise.all([
      fetch('https://duelyst.grudge-studio.com/catalog/badbudz.json', { headers: { 'user-agent': 'thc-battle-gameplay' } }),
      fetch('https://duelyst.grudge-studio.com/catalog/catalog.json', { headers: { 'user-agent': 'thc-battle-gameplay' } }),
    ]);
    if (!bb.ok || !cat.ok) {
      return res.status(502).json({ success: false, error: `codex ${bb.status}/${cat.status}` });
    }
    const badbudz = await bb.json();
    const catalog = await cat.json();
    const bbCards = Array.isArray(badbudz.cards) ? badbudz.cards : [];
    const gw = Array.isArray(catalog.heroes) ? catalog.heroes : [];
    const cards = [
      ...bbCards.map((c: any) => {
        const did = c.duelystId || String(c.id || '').replace(/^badbudz:/, '');
        return {
          ...c,
          id: String(c.id || '').startsWith('badbudz:') ? c.id : `badbudz:${did}`,
          cardSet: 'badbudz',
          image: c.image || `https://assets.grudge-studio.com/sprites/duelyst/units/${did}.png`,
          duelystId: did,
        };
      }),
      ...gw.map((h: any) => ({
        id: `grudawars:${String(h.id || '').replace(/^gw_/, '')}`,
        name: h.name,
        image: h.clips?.idle || h.image,
        cardSet: 'grudawars',
        cost: 3, attack: 3, health: 4, rarity: 'uncommon', class: 'melee', type: 'minion',
        abilities: [],
      })),
    ];
    res.json({ success: true, set: 'play', count: cards.length, cards });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || 'gameplay failed' });
  }
}
