import Counter from "./metric/counter";
import Histogram from "./metric/histogram";
import Metric, { type Labels } from "./metric/metric";

export default class MetricRegistry {
  constructor() {}

  public static DEFAULT_REGISTRY = new MetricRegistry();

  private metrics: Map<string, Metric> = new Map();

  register(metric: Metric) {
    this.metrics.set(metric.getHashKey(), metric);
  }

  unregister(metric: Metric) {
    this.metrics.delete(metric.getHashKey());
  }

  public counter(name: string, labels?: Labels): Counter {
    const key = Metric.hashKey(name, labels);

    if (!this.metrics.has(key)) {
      const counter = new Counter(name, labels);
      this.register(counter);
      return counter;
    } else {
      return this.metrics.get(key) as Counter;
    }
  }

  public histogram(name: string, labels?: Labels) {
    const key = Metric.hashKey(name, labels);

    if (!this.metrics.has(key)) {
      const histogram = new Histogram(name, labels);
      this.register(histogram);
      return histogram;
    } else {
      return this.metrics.get(key) as Histogram;
    }
  }

  collect(): string {
    return this.metrics.values()
      .map((metric) => metric.collect())
      .toArray()
      .join("\n");
  }
}
