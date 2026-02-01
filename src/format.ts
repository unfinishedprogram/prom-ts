import type { Labels } from "./metric/metric";

export type TimeseriesFormatter = (
  name: string,
  value: number,
  labels?: Labels,
) => string;

export type MetadataFormatter = (
  name: string,
  type: string,
  description?: string,
) => string;

export type MetricFormatter = {
  timeseries: TimeseriesFormatter;
  metadata: MetadataFormatter;
};

export const defaultFormatter = {
  timeseries: formatTimeseries,
  metadata: formatMetadata,
};

function formatTimeseries(
  name: string,
  value: number,
  labels?: Labels,
): string {
  if (labels) {
    return `${name}{${formatLabels(labels)}} ${value}\n`;
  } else {
    return `${name} ${value}\n`;
  }
}

function formatLabels(labels: Record<string, string>): string {
  return Object.entries(labels)
    .map(([key, value]) => `${key}="${value}"`)
    .join(", ");
}

function formatMetadata(name: string, type: string, description?: string) {
  let result = "";
  if (description) {
    result += `# HELP ${name} ${description}\n`;
  }
  result += `# TYPE ${name} ${type}\n`;
  return result;
}
