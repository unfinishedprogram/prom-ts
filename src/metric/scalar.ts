import type { Aggregator, MetricSample } from "../aggregator";
import Metric, { type MetricType } from "./metric";

export default abstract class Scalar extends Metric {
  public abstract readonly value: number;

  #metricType!: "counter" | "gauge";

  get metricType(): "counter" | "gauge" {
    return this.#metricType;
  }

  constructor(
    name: string,
    metricType: "counter" | "gauge",
    labels?: Record<string, string>,
  ) {
    super(name, labels);
    this.#metricType = metricType;
  }

  aggregate(agg: Aggregator) {
    const metric = {
      name: this.name,
      type: this.metricType,
      description: this.description,
      value: this.value,
      labels: this.labels,
    } satisfies MetricSample;

    agg.observe(metric);
  }
}
