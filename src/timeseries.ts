function formatLabels(labels: Record<string, string>): string {
  return Object.entries(labels)
    .map(([key, value]) => `${key}="${value}"`)
    .join(", ");
}

export function formatTimeSeries(
  name: string,
  value: number,
  labels?: Record<string, string>,
): string {
  if (labels) {
    return `${name}{${formatLabels(labels)}} ${value}`;
  } else {
    return `${name} ${value}`;
  }
}
