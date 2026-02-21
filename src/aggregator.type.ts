import type { AggregateSample } from "./aggregator";
import type { MetricFormatter } from "./format";
import type { Labels, MetricType } from "./metric/metric";

export type HistogramSample = {
  name: string;
  type: "histogram";
  description?: string;
  labels?: Labels;
  buckets: {
    le: string;
    count: number;
  }[];
  count: number;
  sum: number;
  min: number;
  max: number;
};

export type CounterSample = {
  name: string;
  type: "counter";
  description?: string;
  labels?: Labels;
  value: number;
};

export type GaugeSample = {
  name: string;
  type: "gauge";
  description?: string;
  labels?: Labels;
  value: number;
};

export type MetricSample = HistogramSample | CounterSample | GaugeSample;

export interface Aggregator {
  observe(sample: MetricSample): void;
  format(formatter: MetricFormatter): string;
  toString(): string;
}
