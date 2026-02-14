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
  entries: (Metadata | Sample)[] = [];

  get metadata() {
    return this.entries.filter((entry): entry is Metadata => "type" in entry);
  }

  get samples() {
    return this.entries.filter((entry): entry is Sample => "value" in entry);
  }

  constructor(public formatter: MetricFormatter = defaultFormatter) {
  }

  public addMeta(name: string, type: string, description?: string) {
    this.entries.push({ name, type, description });
    return this;
  }

  public addSample(name: string, value: number, labels?: Labels) {
    this.entries.push({ name, value, labels });
    return this;
  }

  public format(formatter: MetricFormatter = this.formatter): string {
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
    return this.format(this.formatter);
  }
}
