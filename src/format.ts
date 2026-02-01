import type { Labels } from "./metric/metric";

export type TimeseriesFormatter = (
  name: string,
  value: number,
  labels?: Labels,
) => string;

export function defaultFormatter(
  name: string,
  value: number,
  labels?: Labels,
): string {
  if (labels) {
    return `${name}{${formatLabels(labels)}} ${value}`;
  } else {
    return `${name} ${value}`;
  }
}

function formatLabels(labels: Record<string, string>): string {
  return Object.entries(labels)
    .map(([key, value]) => `${key}="${value}"`)
    .join(", ");
}
