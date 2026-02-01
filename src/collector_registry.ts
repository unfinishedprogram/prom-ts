import Counter from "./metric/counter";
import Gauge from "./metric/gauge";
import Observer from "./metric/observer";
import Histogram from "./metric/histogram";
import Metric, { type Labels } from "./metric/metric";
import { defaultFormatter, type MetricFormatter } from "./format";

export default class MetricRegistry {
  constructor() {}

  public static readonly DEFAULT_REGISTRY = new MetricRegistry();

  private metrics: Map<string, Metric> = new Map();

  public register(metric: Metric) {
    this.metrics.set(metric.getHashKey(), metric);
  }

  public unregister(metric: Metric) {
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

  public gauge(name: string, labels?: Labels) {
    const key = Metric.hashKey(name, labels);

    if (!this.metrics.has(key)) {
      const gauge = new Gauge(name, labels);
      this.register(gauge);
      return gauge;
    } else {
      return this.metrics.get(key) as Gauge;
    }
  }

  public observer(name: string, observeFn: () => number, labels?: Labels) {
    const key = Metric.hashKey(name, labels);

    if (!this.metrics.has(key)) {
      const observer = new Observer(name, observeFn, labels);
      this.register(observer);
      return observer;
    } else {
      return this.metrics.get(key) as Observer;
    }
  }

  public collect(formatter: MetricFormatter = defaultFormatter): string {
    return this.metrics.values()
      .map((metric) => metric.collect(formatter))
      .toArray()
      .join("");
  }
}
