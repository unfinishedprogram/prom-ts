import type { Aggregator } from "../aggregator";
import type Collector from "../collector";

export type Labels = Readonly<Record<string, string>>;
export type MetricType = "counter" | "gauge" | "histogram" | "summary";

export default abstract class Metric implements Collector {
  abstract readonly metricType: MetricType;
  #description?: string;

  constructor(
    readonly name: string,
    readonly labels?: Labels,
  ) {}

  public getHashKey(): string {
    return Metric.hashKey(this.name, this.labels);
  }

  public static hashKey(name: string, labels?: Labels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    return `${name}|${JSON.stringify(labels)}`;
  }

  abstract aggregate(agg: Aggregator): void;

  public describe(description: string): this {
    this.#description = description;
    return this;
  }

  get description(): string | undefined {
    return this.#description;
  }
}
