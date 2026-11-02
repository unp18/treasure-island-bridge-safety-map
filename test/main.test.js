// Smoke test of the browser wiring (src/ui/main.js) against a minimal fake DOM:
// proves the four buttons are connected to the right Replay actions.
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('Load / Step / Run to End / Reset buttons drive the page', async () => {
  let onClick;
  const app = {
    innerHTML: '',
    addEventListener: (type, fn) => { if (type === 'click') onClick = fn; },
    querySelector: (sel) => (sel.startsWith('[data-action') ? { focus() {} } : null),
  };
  globalThis.document = { getElementById: (id) => (id === 'app' ? app : null) };
  await import('../src/ui/main.js');

  const click = (action, disabled = false) => onClick({ target: { closest: () => ({ dataset: { action }, disabled }) } });
  const progress = () => /class="progress">([^<]*)</.exec(app.innerHTML)[1];

  assert.equal(progress(), 'No archipelago loaded');
  click('load');
  assert.equal(progress(), 'Ready: 0 of 53 events');
  click('step'); click('step');
  assert.equal(progress(), 'Step 2 of 53');
  click('run');
  assert.equal(progress(), 'Step 53 of 53');
  assert.ok(app.innerHTML.includes('Components: <b>1</b> (final)'));
  click('reset');
  assert.equal(progress(), 'Ready: 0 of 53 events');
  const before = app.innerHTML;
  click('step', true); // a disabled button does nothing
  assert.equal(app.innerHTML, before);
  onClick({ target: { closest: () => null } }); // click on empty space does nothing
  assert.equal(app.innerHTML, before);
});
