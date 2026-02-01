import { defaultFormatter, type MetricFormatter } from "./format";
import type { Labels } from "./metric/metric";

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

export class Aggregator {
  metadata: Metadata[] = [];
  samples: Sample[] = [];

  constructor(public formatter: MetricFormatter = defaultFormatter) {
  }

  public addMeta(name: string, type: string, description?: string) {
    this.metadata.push({ name, type, description });
    return this;
  }

  public addSample(name: string, value: number, labels?: Labels) {
    this.samples.push({ name, value, labels });
    return this;
  }

  public format(formatter: MetricFormatter = this.formatter): string {
    let result = "";

    for (const meta of this.metadata) {
      result += formatter.metadata(meta.name, meta.type, meta.description);
    }

    for (const sample of this.samples) {
      result += formatter.timeseries(sample.name, sample.value, sample.labels);
    }

    return result;
  }

  public toString(): string {
    return this.format(this.formatter);
  }
}
