const UA = { 'user-agent': 'grok-smoke', Origin: 'https://thc-labz-battle.vercel.app' };

async function hit(url, opts = {}) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { redirect: 'follow', headers: { ...UA, ...(opts.headers || {}) }, method: opts.method || 'GET' });
    const ct = r.headers.get('content-type') || '';
    const body = opts.noBody ? '' : await r.text();
    return {
      url,
      status: r.status,
      ms: Date.now() - t0,
      ct: ct.split(';')[0],
      final: r.url,
      acao: r.headers.get('access-control-allow-origin'),
      snippet: body.slice(0, 80).replace(/\s+/g, ' '),
      len: body.length,
      body,
    };
  } catch (e) {
    return { url, status: 0, err: e.message, ms: Date.now() - t0 };
  }
}

function extractAssets(html, base) {
  const urls = new Set();
  const re = /(?:href|src)=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const u = m[1];
    if (!u || u.startsWith('data:') || u.startsWith('javascript:') || u.startsWith('#')) continue;
    try {
      urls.add(new URL(u, base).href);
    } catch {
      /* skip */
    }
  }
  return [...urls];
}

const pages = [
  'https://thc-labz-battle.vercel.app/',
  'https://thc-labz-battle.vercel.app/library?set=badbudz',
  'https://thc-labz-battle.vercel.app/library?tab=badseed',
  'https://battle.thc-labz.xyz/library',
  'https://dopebudz.thc-labz.xyz/',
  'https://growerz.thc-labz.xyz/',
  'https://nemesis.grudge-studio.com/',
  'https://nemesis.grudge-studio.com/wallet',
  'https://nemesis.grudge-studio.com/battle-hub',
];

const apis = [
  'https://dope-budz-production.up.railway.app/_health',
  'https://dope-budz-production.up.railway.app/api/health',
  'https://thc-labz-battle.vercel.app/api/health',
  'https://thc-labz-battle.vercel.app/api/account/snapshot?wallet=11111111111111111111111111111111',
  'https://nexus-nemesis-game-production.up.railway.app/api/health',
  'https://nemesis.grudge-studio.com/api/health',
  'https://nexus-nemesis-game-production.up.railway.app/socket.io/?EIO=4&transport=polling',
  'https://nemesis.grudge-studio.com/socket.io/?EIO=4&transport=polling',
  'https://dope-budz-production.up.railway.app/socket.io/?EIO=4&transport=polling',
  'https://dopebudz.thc-labz.xyz/socket.io/?EIO=4&transport=polling',
  'https://thc-labz-battle.vercel.app/assets/index.css',
  'https://duelyst.grudge-studio.com/tcg-chrome/frames/thc-epic-gold.png',
  'https://duelyst.grudge-studio.com/tcg-chrome/thc/bg-legendary.png',
  'https://assets.grudge-studio.com/sprites/duelyst/units/f5_ankylos.png',
  'https://dopebudz.thc-labz.xyz/images/racalvin-seed-bag.png',
  'https://dopebudz.thc-labz.xyz/images/grudge-thc-logo.png',
  'https://thc-labz-battle.vercel.app/thc-labz-logo-nowords.png',
  'https://site.thc-labz.xyz/',
];

console.log('=== APIs / assets / sockets ===');
for (const u of apis) {
  const r = await hit(u, { noBody: !u.includes('socket.io') && !u.includes('health') && !u.includes('snapshot') });
  const flag = r.status && r.status < 400 ? 'OK' : 'FAIL';
  console.log(flag, r.status || r.err, r.ms + 'ms', r.ct || '', r.acao || '', u);
  if (r.snippet) console.log('   ', r.snippet);
}

console.log('\n=== Pages + linked CSS/JS ===');
for (const p of pages) {
  const r = await hit(p);
  const flag = r.status && r.status < 400 ? 'OK' : 'FAIL';
  console.log(flag, r.status || r.err, r.ct, 'title?', /<title>([^<]*)/i.exec(r.body || '')?.[1] || r.snippet, p);
  if (!r.body) continue;
  const assets = extractAssets(r.body, p).filter((u) =>
    /\.(css|js|png|jpg|webp|woff2?)(\?|$)/i.test(u) || u.includes('/assets/'),
  );
  const sample = assets.slice(0, 12);
  for (const a of sample) {
    const ar = await hit(a, { method: 'HEAD', noBody: true });
    const af = ar.status && ar.status < 400 ? '  ok' : '  MISS';
    console.log(af, ar.status || ar.err, a);
  }
}
