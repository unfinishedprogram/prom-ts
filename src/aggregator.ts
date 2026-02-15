import { defaultFormatter, type MetricFormatter } from "./format";
import { mergeLabels } from "./util";
import type { Labels, MetricType } from "./metric/metric";

export type AggregateSample = {
  value: number;
  labels?: Record<string, string>;
};

type AggregateEntry = {
  type: MetricType;
  description?: string;
  samples: AggregateSample[];
};

export interface Aggregator {
  addMeta(name: string, type: MetricType, description?: string): void;
  addSample(name: string, value: number, labels?: Labels): void;
  observe(
    name: string,
    type: MetricType,
    description: string | undefined,
    samples: AggregateSample[],
  ): void;
  format(formatter: MetricFormatter): string;
  toString(): string;
}

export class BaseAggregator implements Aggregator {
  public readonly metrics: Record<string, AggregateEntry> = {};

  constructor() {}

  observe(
    name: string,
    type: MetricType,
    description: string | undefined,
    samples: AggregateSample[],
  ) {
    this.addMeta(name, type, description);
    for (const sample of samples) {
      this.addSample(name, sample.value, sample.labels);
    }
  }

  addMeta(name: string, type: MetricType, description?: string) {
    if (!this.metrics[name]) {
      this.metrics[name] = { type, description, samples: [] };
    } else {
      this.metrics[name].type = type;
      this.metrics[name].description = description;
    }
  }

  addSample(name: string, value: number, labels?: Record<string, string>) {
    if (!this.metrics[name]) {
      // Default to gauge type if meta is not defined
      this.metrics[name] = { type: "gauge", samples: [{ value, labels }] };
    } else {
      this.metrics[name].samples.push({ value, labels });
    }
  }

  format(formatter: MetricFormatter): string {
    let result = "";
    for (const [name, entry] of Object.entries(this.metrics)) {
      if (entry.samples.length === 0) continue;

      result += formatter.metadata(name, entry.type, entry.description);

      for (const sample of entry.samples) {
        result += formatter.timeseries(name, sample.value, sample.labels);
      }

      result += "\n";
    }

    return result;
  }

  toString() {
    return this.format(defaultFormatter);
  }
}

export class LabelingAggregator implements Aggregator {
  constructor(
    private readonly baseAggregator: Aggregator,
    readonly defaultLabels: Labels = {},
  ) {}

  addMeta(name: string, type: MetricType, description?: string) {
    this.baseAggregator.addMeta(name, type, description);
  }

  addSample(name: string, value: number, labels?: Labels) {
    this.baseAggregator.addSample(
      name,
      value,
      mergeLabels(this.defaultLabels, labels),
    );
  }

  observe(
    name: string,
    type: MetricType,
    description: string | undefined,
    samples: AggregateSample[],
  ) {
    const mergedSamples = samples.map((sample) => ({
      value: sample.value,
      labels: mergeLabels(this.defaultLabels, sample.labels),
    }));

    this.baseAggregator.observe(name, type, description, mergedSamples);
  }

  format(formatter: MetricFormatter): string {
    return this.baseAggregator.format(formatter);
  }
}
