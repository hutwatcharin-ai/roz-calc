// The base level cap on RO Zero Global, in one place.
//
// It was 50 at launch and became 60 with the patch of 3 Sep 2026, the same one
// that opened the second job. Two files were carrying that number separately
// (memorial gear's rank table and nothing else), and the EXP guide was not
// carrying it at all -- which is how the site ended up publishing a table that
// stops at 50 without ever telling the reader there are ten levels past it.
//
// The EXP a level 51-60 needs is a separate matter and is NOT here: nobody
// publishes it. Checked on 9 Sep 2026 --
//   the official guide page the 1-50 table came from still ends at 50
//   roz-global.info's mirror of that table ends at 50, digit for digit ours
//   rozerodb's EXP calculator, which titles itself "OFFICIAL GLOBAL EXP
//     TABLE", offers levels 1-50 in every one of its four level pickers
//   our prontera crawl (63 non-entity pages) and the Elvyl sheet (17 tabs)
//     have no EXP table at all
//   a web search in English and Thai turns up only Ragnarok Project Zero's
//     chart, which is a private server's own numbers, not this game's
// So the site says the cap is 60, publishes 1-50, and says the rest is
// unpublished rather than extrapolating a curve that would look official.

/** Highest base level a character can reach today. */
export const BASE_LEVEL_CAP = 60;

/** When the cap last moved, for a sentence that has to age honestly. */
export const BASE_LEVEL_CAP_SINCE = '3 ก.ย. 2026';
