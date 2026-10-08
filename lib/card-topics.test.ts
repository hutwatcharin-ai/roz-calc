import { describe, expect, it } from 'vitest';
import { cardsForTopic, publishedTopics, topicBySlug } from './card-topics';

const ids = (slug: string) => cardsForTopic(slug).map((c) => c.id);

describe('card topics from the client text', () => {
  it('finds the silence guards and not the cards that inflict silence', () => {
    // Marduk: "ป้องกันสถานะ Silence 100%"; Metaller and Brilight make the
    // enemy silent, which is the opposite question.
    expect(ids('guard-silence')).toContain(4112);
    expect(ids('guard-silence')).not.toContain(4057);
    expect(ids('guard-silence')).not.toContain(4213);
  });

  it('reads element resistance split over two lines', () => {
    // Hode: "เพิ่มความต้านทานต่อการโจมตี" / "ธาตุ Earth 30%".
    expect(ids('guard-earth')).toContain(4081);
    expect(cardsForTopic('guard-earth').find((c) => c.id === 4081)!.lines[0]).toContain('Earth 30%');
  });

  it('keeps damage dealt apart from damage taken', () => {
    expect(ids('vs-race-brute')).toContain(4060); // Goblin: more damage to Brute
    expect(ids('guard-race-brute')).toContain(4066); // Orc Warrior: less damage from Brute
    expect(ids('vs-race-brute')).not.toContain(4066);
  });

  it('lists cards by slot from the slot line', () => {
    expect(ids('slot-shield')).toContain(4012); // Thief Bug Egg Card, Shield
    expect(ids('slot-shield')).not.toContain(4001); // Poring Card, Armor
  });

  it('publishes non-empty topics, and every "hits element" page', () => {
    const slugs = publishedTopics().map((t) => t.slug);
    expect(slugs).toContain('guard-silence');
    expect(slugs).toContain('vs-earth'); // empty, but searched for
    expect(slugs).not.toContain('guard-poison'); // empty and not a search
    for (const s of slugs) expect(topicBySlug(s)).not.toBeNull();
  });
});

describe('owner-tested client lines', () => {
  // Crab Card's client text claims +30% against Water monsters; in game it is
  // ATK +5 and nothing else (owner, 8 Oct 2026).
  it('keeps Crab Card off the Water page', () => {
    expect(cardsForTopic('vs-water').map((c) => c.id)).not.toContain(4153);
  });
  it('still lists the real Water cards', () => {
    expect(cardsForTopic('vs-water').map((c) => c.id)).toContain(4069);
  });
});
