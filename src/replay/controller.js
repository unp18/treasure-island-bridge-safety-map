import { analyze } from '../engine/analyze.js';
import { stateAt } from './state.js';

const deepClone = (o) => JSON.parse(JSON.stringify(o));

/**
 * Holds the replay position. Step / runToEnd / reset all move an index over the
 * SAME recorded event list, so they cannot disagree with each other.
 *
 * load(graph) keeps a private deep copy of the graph; reset() re-loads that
 * copy, restoring the original graph and the pre-traversal state exactly.
 */
export class Replay {
  #pristine = null;
  #analysis = null;
  #errors = [];
  #index = -1;

  load(graph) {
    this.#pristine = deepClone(graph);
    return this.#analyseFromPristine();
  }

  reset() {
    if (this.#pristine === null) return { ok: true, errors: [] };
    return this.#analyseFromPristine();
  }

  step() {
    if (!this.#analysis || this.#index >= this.#analysis.events.length - 1) return false;
    this.#index += 1;
    return true;
  }

  runToEnd() {
    if (!this.#analysis) return false;
    const last = this.#analysis.events.length - 1;
    if (this.#index >= last) return false;
    this.#index = last;
    return true;
  }

  get analysis() { return this.#analysis; }
  get errors() { return this.#errors; }
  get index() { return this.#index; }
  get total() { return this.#analysis ? this.#analysis.events.length : 0; }
  get atEnd() { return this.#analysis !== null && this.#index === this.total - 1; }
  get history() { return this.#analysis ? this.#analysis.events.slice(0, this.#index + 1) : []; }
  get state() { return this.#analysis ? stateAt(this.#analysis, this.#index) : null; }

  /** Everything observable, as plain data (used by tests and by the UI to compare runs). */
  snapshot() {
    return deepClone({
      index: this.#index, errors: this.#errors, analysis: this.#analysis,
      history: this.history, state: this.state,
    });
  }

  #analyseFromPristine() {
    const result = analyze(this.#pristine);
    this.#index = -1;
    if (!result.ok) {
      this.#analysis = null; // no stale replay or results
      this.#errors = result.errors;
      return { ok: false, errors: result.errors };
    }
    this.#analysis = result;
    this.#errors = [];
    return { ok: true, errors: [] };
  }
}
