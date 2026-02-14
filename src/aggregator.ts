import { defaultFormatter, type MetricFormatter } from "./format";
import { mergeLabels } from "./util";
import type { Labels, MetricType } from "./metric/metric";

export type Metadata = {
  name: string;
  type: string;
  description?: string;
};

export type Sample = {
  name: string;
  value: number;
  labels?: Labels;
};

export interface Aggregator {
  addMeta(name: string, type: MetricType, description?: string): void;
  addSample(name: string, value: number, labels?: Labels): void;
  observe(
    name: string,
    type: MetricType,
    value: number,
    description?: string,
    labels?: Record<string, string>,
  ): void;
  format(formatter: MetricFormatter): string;
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
    value: number,
    description?: string,
    labels?: Record<string, string>,
  ) {
    this.baseAggregator.observe(
      name,
      type,
      value,
      description,
      mergeLabels(this.defaultLabels, labels),
    );
  }

  format(formatter: MetricFormatter): string {
    return this.baseAggregator.format(formatter);
  }
}

export class DefaultAggregator implements Aggregator {
  constructor() {}

  entries: (Metadata | Sample)[] = [];

  get metadata() {
    return this.entries.filter((entry): entry is Metadata => "type" in entry);
  }

  get samples() {
    return this.entries.filter((entry): entry is Sample => "value" in entry);
  }

  public addMeta(name: string, type: MetricType, description?: string) {
    this.entries.push({ name, type, description });
  }

  public addSample(name: string, value: number, labels?: Labels) {
    this.entries.push({ name, value, labels });
  }

  public observe = (
    name: string,
    type: MetricType,
    value: number,
    description?: string,
    labels?: Record<string, string>,
  ) => {
    this.addMeta(name, type, description);
    this.addSample(name, value, labels);
  };

  public format(formatter: MetricFormatter): string {
    let result = "";

    for (const entry of this.entries) {
      if ("type" in entry) {
        result += formatter.metadata(entry.name, entry.type, entry.description);
      } else {
        result += formatter.timeseries(entry.name, entry.value, entry.labels);
      }
    }

    return result;
  }

  public toString(): string {
    return this.format(defaultFormatter);
  }
}
