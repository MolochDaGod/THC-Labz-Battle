import fs from 'node:fs';

const p = 'F:/GitHub/THC-Labz-Battle/shared/classificationCardDatabase.ts';
let t = fs.readFileSync(p, 'utf8');

if (!t.includes("from './codexPlaySets.generated'")) {
  t = t.replace(
    'export type CardSetId',
    "import { CODEX_BADBUDZ_CARDS, CODEX_GRUDAWARS_CARDS } from './codexPlaySets.generated';\nimport { CITY_PVE_CARDS } from './cityPveCards.generated';\n\nexport type CardSetId",
  );
}

const start = t.indexOf('export const BADBUDZ_CARDS');
if (start < 0) {
  console.error('start not found');
  process.exit(1);
}
const commentStart = t.lastIndexOf('/**', start);
const cut = commentStart >= 0 ? commentStart : start;
const after = t.indexOf('export function cardsForSet');
if (after < 0) {
  console.error('cardsForSet not found');
  process.exit(1);
}

const insert = `export const BADBUDZ_CARDS: ClassificationCard[] = CODEX_BADBUDZ_CARDS.map((c) => stampSet(c, 'badbudz'));

export const GRUDAWARS_CARDS: ClassificationCard[] = CODEX_GRUDAWARS_CARDS.map((c) => stampSet(c, 'grudawars'));

const PVE_BY_ID = new Map(CITY_PVE_CARDS.map((c) => [c.id, c]));

function overlayClashPve(card: ClassificationCard): ClassificationCard {
  const pve = PVE_BY_ID.get(card.id);
  if (!pve) return stampSet({ ...card, statScale: card.statScale || 'clash' }, 'clash');
  return stampSet({
    ...card,
    name: pve.name,
    image: pve.image || card.image,
    cost: pve.cost,
    attack: pve.attack,
    health: pve.health,
    rarity: pve.rarity,
    class: pve.class,
    type: pve.type,
    abilities: pve.abilities,
    abilityDesc: pve.abilityDesc || card.abilityDesc,
    playStyles: pve.playStyles,
    keywords: pve.keywords,
    abilityIcons: pve.abilityIcons,
    artKind: pve.artKind || 'portrait',
    statScale: 'clash',
  }, 'clash');
}

/** Current THC Battle cards as city PVE challengers (city-pve.json). Not Nemesis. */
export const CLASH_CARDS: ClassificationCard[] = (() => {
  const base = CLASSIFICATION_CARD_DATABASE.map(overlayClashPve);
  const have = new Set(base.map((c) => c.id));
  const extra = CITY_PVE_CARDS.filter((c) => !have.has(c.id)).map((c) => stampSet({ ...c, statScale: 'clash' }, 'clash'));
  return [...base, ...extra];
})();

/** Player library / pack pool — BadBudz + GrudaWars only. Clash is PVE. */
export const LIBRARY_CARDS: ClassificationCard[] = [
  ...BADBUDZ_CARDS,
  ...GRUDAWARS_CARDS,
];

`;

t = t.slice(0, cut) + insert + t.slice(after);
fs.writeFileSync(p, t);
console.log('spliced classification, length', t.length);
