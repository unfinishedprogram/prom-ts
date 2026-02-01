import type { MetricFormatter } from "../format";

export type Labels = Readonly<Record<string, string>>;
export type MetricType = "counter" | "gauge" | "histogram" | "summary";

export default abstract class Metric {
  abstract readonly metricType: MetricType;

  constructor(
    readonly name: string,
    readonly labels?: Labels,
    readonly description?: string,
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
}
