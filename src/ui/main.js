// Thin browser wiring: four buttons -> Replay -> buildView -> renderApp.
import { Replay } from '../replay/controller.js';
import { archipelago } from '../data/archipelago.js';
import { buildView } from './viewmodel.js';
import { renderApp } from './html.js';

const app = document.getElementById('app');
const replay = new Replay();
const actions = {
  load: () => replay.load(archipelago),
  step: () => replay.step(),
  run: () => replay.runToEnd(),
  reset: () => replay.reset(),
};

function draw(focusAction) {
  app.innerHTML = renderApp(buildView(replay, archipelago));
  const target = app.querySelector(`[data-action="${focusAction}"]:not([disabled])`) || app.querySelector('[data-action="load"]');
  if (focusAction && target) target.focus({ preventScroll: true });
  const box = app.querySelector('.hist');
  const cur = box && box.querySelector('.cur');
  if (cur) box.scrollTop = cur.offsetTop - box.clientHeight / 2;
}

app.addEventListener('click', (e) => {
  const b = e.target.closest('[data-action]');
  if (!b || b.disabled) return;
  actions[b.dataset.action]();
  draw(b.dataset.action);
});
draw();
