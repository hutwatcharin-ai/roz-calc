import { describe, expect, it } from 'vitest';
import {
  blockedBy,
  CLASS_SLUGS,
  decodeBuild,
  encodeBuild,
  lineFor,
  lower,
  raise,
  spendByStage,
  type Build,
} from './skill-planner';

describe('lineFor', () => {
  it('walks the whole class line, base class first', () => {
    expect(lineFor('knight').map((s) => s.slug)).toEqual(['novice', 'swordsman', 'knight']);
    expect(lineFor('swordsman').map((s) => s.slug)).toEqual(['novice', 'swordsman']);
  });

  it('gives the point budget the source states for each tier', () => {
    // 10 / 49 / 59, matching one point per job level against the caps the
    // planner's own job-level fields carry (11 / 50 / 60).
    expect(lineFor('knight').map((s) => s.skill_points)).toEqual([10, 49, 59]);
  });

  it('has every class the planner offers, and nothing else', () => {
    expect(CLASS_SLUGS).toHaveLength(20);
    expect(CLASS_SLUGS).toContain('novice');
    expect(CLASS_SLUGS).toContain('wizard');
    expect(lineFor('not-a-class')).toEqual([]);
  });
});

describe('raise', () => {
  it('raises a skill with no prerequisites', () => {
    expect(raise('swordsman', {}, 'bash')).toEqual({ bash: 1 });
  });

  it('pulls prerequisites up instead of refusing', () => {
    // Bowling Bash needs Bash 5 + Magnum Break 3, and Magnum Break itself
    // needs Bash 5 -- so one click has to resolve a chain, not just an edge.
    const build = raise('knight', {}, 'bowling-bash');
    expect(build['bowling-bash']).toBe(1);
    expect(build.bash).toBeGreaterThanOrEqual(5);
    expect(build['magnum-break']).toBeGreaterThanOrEqual(3);
  });

  it('stops at the skill max level', () => {
    let build: Build = {};
    for (let i = 0; i < 15; i += 1) build = raise('swordsman', build, 'bash');
    expect(build.bash).toBe(10);
  });

  it('leaves the build untouched for a skill this class line does not have', () => {
    const build = { bash: 1 };
    expect(raise('swordsman', build, 'storm-gust')).toBe(build);
  });
});

describe('lower', () => {
  it('lowers a skill nothing depends on', () => {
    expect(lower('swordsman', { bash: 2 }, 'bash')).toEqual({ bash: 1 });
    expect(lower('swordsman', { bash: 1 }, 'bash')).toEqual({});
  });

  it('refuses while a dependent still needs the level', () => {
    // Magnum Break requires Bash 5, so Bash cannot drop to 4 under it.
    const build = { bash: 5, 'magnum-break': 1 };
    expect(lower('knight', build, 'bash')).toBe(build);
  });

  it('allows the drop once the dependent is gone', () => {
    expect(lower('knight', { bash: 5 }, 'bash')).toEqual({ bash: 4 });
  });

  it('does nothing at zero', () => {
    const build = {};
    expect(lower('swordsman', build, 'bash')).toBe(build);
  });
});

describe('blockedBy', () => {
  it('names the prerequisite that is short, with the level it wants', () => {
    const blocking = blockedBy('knight', { bash: 2 }, 'magnum-break');
    expect(blocking).toEqual([{ slug: 'bash', name: 'Bash', level: 5 }]);
  });

  it('is empty once the prerequisite is met', () => {
    expect(blockedBy('knight', { bash: 5 }, 'magnum-break')).toEqual([]);
  });
});

describe('spendByStage', () => {
  it('counts points per stage and flags the one that is over', () => {
    const spend = spendByStage('swordsman', { bash: 10, 'basic-skill': 9 });
    const novice = spend.find((s) => s.stage.slug === 'novice')!;
    const swordsman = spend.find((s) => s.stage.slug === 'swordsman')!;
    expect(novice.spent).toBe(9);
    expect(novice.over).toBe(false);
    expect(swordsman.spent).toBe(10);
    expect(swordsman.budget).toBe(49);
    expect(swordsman.over).toBe(false);
  });

  it('does not charge for a free quest skill', () => {
    // Fatal Blow is flagged free in the source: the planner on the site the
    // data came from labels it "no skill points".
    const spend = spendByStage('swordsman', { 'fatal-blow': 1, berserk: 1 });
    expect(spend.find((s) => s.stage.slug === 'swordsman')!.spent).toBe(0);
  });

  it('reports going over budget rather than preventing it', () => {
    // Deliberately over the 49-point first-class budget: the planner warns, it
    // does not block, because the budget is not a number we have seen the game
    // itself enforce.
    const build: Build = {
      bash: 10, 'sword-mastery': 10, 'increase-hp-recovery': 10, provoke: 10, 'magnum-break': 10, endure: 10,
    };
    const swordsman = spendByStage('swordsman', build).find((s) => s.stage.slug === 'swordsman')!;
    expect(swordsman.spent).toBe(60);
    expect(swordsman.over).toBe(true);
  });
});

describe('encodeBuild / decodeBuild', () => {
  it('round-trips a build', () => {
    const build = { bash: 5, 'magnum-break': 3 };
    expect(decodeBuild('knight', encodeBuild(build))).toEqual(build);
  });

  it('encodes in the shape prontera.info uses, so links interoperate', () => {
    expect(encodeBuild({ 'magnum-break': 3, bash: 5 })).toBe('bash:5~magnum-break:3');
  });

  it('drops a skill the class line does not have', () => {
    expect(decodeBuild('swordsman', 'bash:5~storm-gust:10')).toEqual({ bash: 5 });
  });

  it('clamps a level past the skill maximum', () => {
    expect(decodeBuild('swordsman', 'bash:99')).toEqual({ bash: 10 });
  });

  it('ignores junk instead of throwing', () => {
    expect(decodeBuild('swordsman', 'bash:abc~~:5~bash:0')).toEqual({});
    expect(decodeBuild('swordsman', '')).toEqual({});
  });
});
