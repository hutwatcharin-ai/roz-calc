// Guards the wiring the component tests cannot see: farm-plan-flow.test.tsx
// mounts FarmPlanProvider itself, so the whole feature shipped broken while
// every test was green -- layout.tsx imported the provider but never rendered
// it, and every consumer silently got the default context (ready:false
// forever). A source-level check is crude, but it is the only cheap way to
// fail when a provider import exists without the matching JSX wrapper.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const layout = readFileSync(new URL('./layout.tsx', import.meta.url), 'utf8');

describe('root layout provider wiring', () => {
  it.each(['CharacterContextProvider', 'FarmPlanProvider'])(
    'renders <%s> around the app, not just imports it',
    (name) => {
      expect(layout).toContain(`<${name}>`);
      expect(layout).toContain(`</${name}>`);
    },
  );
});
