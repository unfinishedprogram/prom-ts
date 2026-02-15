import type { Aggregator } from "../aggregator";
import Metric from "./metric";

export default abstract class Scalar extends Metric {
  public abstract readonly value: number;

  constructor(name: string, labels?: Record<string, string>) {
    super(name, labels);
  }

  aggregate(agg: Aggregator) {
    agg.addMeta(this.name, this.metricType, this.description);
    agg.addSample(this.name, this.value, this.labels);
  }
}
