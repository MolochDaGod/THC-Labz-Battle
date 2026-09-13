import type { VercelRequest, VercelResponse } from '@vercel/node';
import { LIBRARY_CARDS } from '../../shared/classificationCardDatabase';

/** Public play catalog. Vercel filesystem route beats the Railway /api rewrite. */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.json({
    success: true,
    set: 'play',
    count: LIBRARY_CARDS.length,
    cards: LIBRARY_CARDS,
  });
}
