import type Collector from "../collector";
import type { MetricFormatter } from "../format";

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

  public abstract collect(formatter: MetricFormatter): string;

  public describe(description: string): this {
    this.#description = description;
    return this;
  }

  get description(): string | undefined {
    return this.#description;
  }
}
