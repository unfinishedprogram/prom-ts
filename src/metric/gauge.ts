import type { Aggregator } from "../aggregator";
import Metric from "./metric";

export default class Gauge extends Metric {
  override metricType = "gauge" as const;
  #value: number = 0;

  constructor(name: string, labels?: Record<string, string>) {
    super(name, labels);
  }

  public set(value: number): void {
    this.#value = value;
  }

  get value(): number {
    return this.#value;
  }

  aggregate(agg: Aggregator) {
    agg.observe({
      name: this.name,
      type: this.metricType,
      description: this.description,
      value: this.value,
      labels: this.labels,
    });
  }
}
