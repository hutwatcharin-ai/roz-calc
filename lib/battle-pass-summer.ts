// Battle Pass (Summer) 2026 -- the reward tracks, transcribed from the
// official event notice (roz.mygnjoy.com, event 101, published 10 Sep 2026).
//
// Two tracks that do not share progress: Free runs to Tier 50, Paid to Tier
// 70. One completed daily mission is one tier; past Tier 50 only the Paid
// track continues, and only by spending Zelstar.
//
// Item ids are our own -- every reward but one was matched against the items
// table by name, so each row can link to the page that says what the thing
// does. The exception is the 7-day Boarding Halter box, which this game's
// item table does not carry (it has the 30-day one, 107822); it is listed with
// no link rather than being pointed at the wrong box.

export interface Reward {
  /** The name exactly as the official notice writes it. */
  label: string;
  /** Our items.id, or null when the item is not in our table. */
  id: number | null;
}

export const REWARDS = {
  red20: { label: '[Event] Red Potion 20ea Box', id: 107721 },
  blue10: { label: '[Event] Blue Potion 10ea Box', id: 9539 },
  smallHeal: { label: '[Event] Small Healing Potion', id: 107337 },
  badge: { label: '[Event] Authoritative Badge', id: 107727 },
  teleport: { label: 'World Teleport Ticket', id: 25464 },
  yellow20: { label: '[Event] Yellow Potion 20ea Box', id: 107723 },
  orange20: { label: '[Event] Orange Potion 20ea Box', id: 107722 },
  white20: { label: '[Event] White Potion 20ea Box', id: 107724 },
  halter7: { label: '[Event] Boarding Halter Box - 7 Days', id: null },
  halter30: { label: '[Event] Boarding Halter Box - 30 Days', id: 107822 },
  smallMana: { label: '[Event] Small Mana Potion', id: 23012 },
  abrasive: { label: '[Event] Enriched Abrasive', id: 107719 },
  concentration: { label: '[Event] Concentration Potion', id: 107726 },
  courseMeal: { label: '[Event] Premium Course Meal', id: 23725 },
  insurance: { label: '[Event] Life Insurance', id: 23657 },
  bubbleGum: { label: '[Event] Bubble Gum', id: 12497 },
  aleBlessing: { label: '[Event] Ale’s Blessing', id: 23729 },
  siegfried: { label: '[Event] Token of Siegfried', id: 6316 },
  agiUp: { label: '[Event] Agi Up Potion', id: 107720 },
  unlimitedDrink: { label: '[Event] Unlimited Drink', id: 23727 },
  mimir: { label: '[Event] Mimir’s Well', id: 23732 },
  flyWing: { label: '[Event] Unlimited Fly Wing 1 Day Box', id: 107320 },
  challengeDrink: { label: '[Event] Challenge Drink', id: 23726 },
  growthElixir: { label: '[Event] Growth Elixir', id: 105671 },
  coin: { label: 'Battle Coin 2026', id: 1003109 },
} as const satisfies Record<string, Reward>;

export type RewardKey = keyof typeof REWARDS;

/** One row of a track: the tier, what it gives, how many. */
export interface TierRow {
  tier: number;
  key: RewardKey;
  qty: number;
}

const rows = (list: [RewardKey, number][]): TierRow[] => list.map(([key, qty], i) => ({ tier: i + 1, key, qty }));

export const FREE_TRACK: TierRow[] = rows([
  ['red20', 3], ['blue10', 3], ['smallHeal', 3], ['badge', 10], ['blue10', 3],
  ['teleport', 5], ['yellow20', 3], ['orange20', 3], ['halter7', 1], ['teleport', 5],
  ['smallMana', 3], ['abrasive', 3], ['yellow20', 3], ['teleport', 5], ['concentration', 3],
  ['blue10', 3], ['courseMeal', 3], ['insurance', 3], ['bubbleGum', 2], ['teleport', 5],
  ['yellow20', 3], ['aleBlessing', 3], ['insurance', 3], ['blue10', 3], ['siegfried', 2],
  ['teleport', 5], ['agiUp', 3], ['smallHeal', 3], ['insurance', 3], ['teleport', 5],
  ['blue10', 3], ['unlimitedDrink', 3], ['courseMeal', 3], ['teleport', 5], ['aleBlessing', 3],
  ['mimir', 3], ['smallMana', 3], ['flyWing', 1], ['yellow20', 3], ['unlimitedDrink', 3],
  ['challengeDrink', 3], ['siegfried', 2], ['bubbleGum', 2], ['courseMeal', 3], ['insurance', 3],
  ['white20', 3], ['teleport', 5], ['growthElixir', 1], ['siegfried', 2], ['coin', 1],
]);

export const PAID_TRACK: TierRow[] = rows([
  ['red20', 5], ['blue10', 5], ['smallHeal', 5], ['badge', 20], ['blue10', 5],
  ['teleport', 20], ['yellow20', 5], ['orange20', 5], ['halter30', 1], ['coin', 1],
  ['smallMana', 5], ['abrasive', 5], ['yellow20', 5], ['teleport', 20], ['concentration', 5],
  ['blue10', 5], ['courseMeal', 5], ['insurance', 5], ['bubbleGum', 3], ['coin', 1],
  ['yellow20', 5], ['aleBlessing', 5], ['insurance', 5], ['flyWing', 1], ['siegfried', 3],
  ['teleport', 20], ['agiUp', 5], ['smallHeal', 5], ['insurance', 5], ['coin', 1],
  ['blue10', 5], ['unlimitedDrink', 5], ['courseMeal', 5], ['teleport', 20], ['aleBlessing', 5],
  ['mimir', 5], ['smallMana', 5], ['flyWing', 1], ['yellow20', 5], ['unlimitedDrink', 5],
  ['challengeDrink', 5], ['siegfried', 3], ['bubbleGum', 3], ['courseMeal', 5], ['insurance', 5],
  ['white20', 5], ['teleport', 20], ['growthElixir', 3], ['siegfried', 3], ['coin', 1],
  ['teleport', 30], ['smallHeal', 10], ['white20', 10], ['blue10', 10], ['siegfried', 5],
  ['teleport', 30], ['unlimitedDrink', 10], ['bubbleGum', 5], ['smallMana', 10], ['coin', 1],
  ['challengeDrink', 10], ['mimir', 10], ['courseMeal', 10], ['agiUp', 10], ['aleBlessing', 10],
  ['siegfried', 5], ['abrasive', 10], ['growthElixir', 5], ['halter30', 1], ['coin', 1],
]);

/** What the Battle Coins buy, from the exchange NPC's own shop window. */
export interface CostumePrice {
  label: string;
  id: number;
  coins: number;
}

export const COSTUMES: CostumePrice[] = [
  { label: '[Costume] Goldfish Head Hat', id: 31597, coins: 1 },
  { label: '[Costume] Ice Cream Hat', id: 19813, coins: 1 },
  { label: '[Costume] Scuba Mask', id: 410083, coins: 1 },
  { label: '[Costume] Poring Tube', id: 480477, coins: 3 },
  { label: '[Costume] Splashing Hat', id: 15925, coins: 3 },
  { label: '[Costume] Surfboard', id: 480321, coins: 6 },
  { label: '[Costume] Poring Pool', id: 420352, coins: 6 },
];

/** Zelstar, and the two items that sell it in the Kafra Shop. */
export const ZELSTAR = { id: 25399, box4: 17918, box40: 17880 } as const;

/** 70 Zelstar buys the ticket; past Tier 50 each further tier costs 5. */
export const ZELSTAR_PER_TICKET = 70;
export const ZELSTAR_PER_TIER = 5;

/** The item the Paid track is started with. */
export const BATTLE_PASS_ITEM_ID = 1002241;

export const EVENT = {
  startUtc: '2026-09-10',
  /** Runs until the 24 Dec maintenance, not to the end of that day. */
  endUtc: '2026-12-24',
  startTh: '10 ก.ย. 2569',
  endTh: '24 ธ.ค. 2569',
} as const;

/** Tiers on a track that hand out a Battle Coin, in order. */
export function coinTiers(track: TierRow[]): number[] {
  return track.filter((r) => r.key === 'coin').map((r) => r.tier);
}

/** Every distinct item id a track can be asked to render an icon for. */
export function itemIdsIn(...tracks: TierRow[][]): number[] {
  const ids = new Set<number>();
  for (const track of tracks) for (const row of track) {
    const id = REWARDS[row.key].id;
    if (id !== null) ids.add(id);
  }
  for (const c of COSTUMES) ids.add(c.id);
  return [...ids];
}
