import Counter from "./metric/counter";
import Metric from "./metric/metric";

export default class MetricRegistry {
  constructor() {}

  public static DEFAULT_REGISTRY = new MetricRegistry();

  private metrics: Map<string, Metric> = new Map();

  register(collector: Metric) {
    this.metrics.set(collector.getHashKey(), collector);
  }

  unregister(collector: Metric) {
    this.metrics.delete(collector.getHashKey());
  }

  public counter(name: string, labels?: Record<string, string>): Counter {
    const key = Metric.hashKey(name, labels);

    if (!this.metrics.has(key)) {
      const counter = new Counter(name, labels);
      this.register(counter);
      return counter;
    } else {
      return this.metrics.get(key) as Counter;
    }
  }

  count(): number {
    return this.metrics.size;
  }
}
