import type { Labels } from "./metric/metric";

export function mergeLabels(a?: Labels, b?: Labels): Labels | undefined {
  if (a && b) {
    return { ...a, ...b };
  } else {
    return a || b;
  }
}
