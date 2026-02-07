import { Aggregator } from "../aggregator";
import Metric from "./metric";

export default abstract class Scalar extends Metric {
  public abstract readonly value: number;

  constructor(name: string, labels?: Record<string, string>) {
    super(name, labels);
  }

  collect<T extends Aggregator>(agg: T): T {
    return agg
      .addMeta(this.name, this.metricType, this.description)
      .addSample(this.name, this.value, this.labels);
  }
}
