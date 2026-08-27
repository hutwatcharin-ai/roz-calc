import { describe, it, expect } from 'vitest';
import { escapeLikePattern } from './like-escape';

// One backslash character, spelled out so every expectation below is built
// from this single source rather than by hand-counting backslashes in a
// string literal.
const BS = '\\';

describe('escapeLikePattern', () => {
  it('escapes a lone backslash', () => {
    expect(escapeLikePattern(BS)).toBe(BS + BS);
  });

  it('escapes a backslash followed by a percent', () => {
    // \% -> \\ (escaped backslash) + \% (escaped percent)
    expect(escapeLikePattern(BS + '%')).toBe(BS + BS + BS + '%');
  });

  it('escapes a backslash followed by an underscore', () => {
    // \_ -> \\ (escaped backslash) + \_ (escaped underscore)
    expect(escapeLikePattern(BS + '_')).toBe(BS + BS + BS + '_');
  });

  it('escapes a percent followed by a backslash', () => {
    // %\ -> \% (escaped percent) + \\ (escaped backslash)
    expect(escapeLikePattern('%' + BS)).toBe(BS + '%' + BS + BS);
  });

  it('escapes a mix of backslash, percent, underscore, backslash', () => {
    // \%_\ -> \\ + \% + \_ + \\
    expect(escapeLikePattern(BS + '%' + '_' + BS)).toBe(BS + BS + BS + '%' + BS + '_' + BS + BS);
  });

  it('escapes two backslashes', () => {
    // \\ -> \\ + \\ (each backslash escaped independently)
    expect(escapeLikePattern(BS + BS)).toBe(BS + BS + BS + BS);
  });

  it('leaves a plain string with no metacharacters unchanged', () => {
    expect(escapeLikePattern('prontera')).toBe('prontera');
  });

  it('leaves an empty string unchanged', () => {
    expect(escapeLikePattern('')).toBe('');
  });
});
