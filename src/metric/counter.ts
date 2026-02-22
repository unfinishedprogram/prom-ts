import type { Aggregator } from "../aggregator";
import Metric from "./metric";

export default class Counter extends Metric {
  override metricType = "counter" as const;
  #value: number = 0;

  constructor(name: string, labels?: Record<string, string>) {
    super(name, labels);
  }

  public inc(value: number = 1): void {
    if (value < 0) return;
    this.#value += value;
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
