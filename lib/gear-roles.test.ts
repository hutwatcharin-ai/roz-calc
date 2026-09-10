import { describe, expect, it } from 'vitest';
import { ROLE_ORDER, ROLE_TH, gearRoles, isGearRole } from './gear-roles';

describe('gearRoles', () => {
  it('reads the groups out of real effect text', () => {
    // Advanced Guild Muffler, verbatim from items.description.
    const muffler =
      'A Muffler designed for seasoned Guild Member. ※ GvG-only options ※ Options do not activate outside GvG regions. MHP +250, MDEF +2, Damage Taken from Players -3%. At +7 refine, ATK/MATK +35. DEF : 7';
    expect(gearRoles(muffler)).toEqual(['magic', 'tank', 'pvp']);
  });

  it('does not read a race bonus out of a bonus against players', () => {
    // "damage to player" is PvP wording, and an earlier draft of the race
    // pattern swallowed it -- which would have put 29 PvP weapons in the
    // "ตีเผ่าเจาะจง" chip.
    const guild = 'Deals +5% damage to player targets.';
    expect(gearRoles(guild)).toContain('pvp');
    expect(gearRoles(guild)).not.toContain('race');
  });

  it('reads both wordings the client uses for a race bonus', () => {
    expect(gearRoles('Increases damage to Undead monsters by 10%.')).toContain('race');
    expect(gearRoles('Adds a 5% bonus against Demi-Human monsters.')).toContain('race');
  });

  it('reads crit in either spelling', () => {
    expect(gearRoles('CRIT +5')).toContain('crit');
    expect(gearRoles('Crit Damage +10%')).toContain('crit');
  });

  it('gives plain gear no group at all', () => {
    // 515 of 876 rows are like this, and a chip row must not pretend
    // otherwise.
    expect(gearRoles('Long coat that reaches below the knees. DEF : 42')).toEqual([]);
    expect(gearRoles(null)).toEqual([]);
    expect(gearRoles(undefined)).toEqual([]);
  });

  it('returns groups in display order, whatever order the text mentions them', () => {
    const roles = gearRoles('ASPD +1, MATK +20, MDEF +3');
    expect(roles).toEqual(['magic', 'tank', 'speed']);
  });
});

describe('the role vocabulary', () => {
  it('describes every group', () => {
    for (const r of ROLE_ORDER) {
      expect(ROLE_TH[r].title, r).toBeTruthy();
      expect(ROLE_TH[r].asks, r).toBeTruthy();
    }
  });

  it('has no chip for ATK or DEF', () => {
    // Deliberate: every weapon has ATK and every armour has DEF, so such a
    // chip would match half the list and filter nothing.
    const titles = ROLE_ORDER.map((r) => ROLE_TH[r].title).join(' ');
    expect(titles).not.toContain('สายตี');
  });

  it('rejects a role that is not one of ours', () => {
    expect(isGearRole('magic')).toBe(true);
    expect(isGearRole('tank')).toBe(true);
    expect(isGearRole('sword')).toBe(false);
    expect(isGearRole(undefined)).toBe(false);
  });
});
