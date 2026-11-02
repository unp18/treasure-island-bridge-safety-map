// Ascending ASCII / UTF-16 code-unit order. Used for every sort in the engine
// so results never depend on locale or on input order.
export const compareIds = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
