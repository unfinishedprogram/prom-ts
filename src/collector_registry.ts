import Counter from "./metric/counter";
import Gauge from "./metric/gauge";
import Observer from "./metric/observer";
import Histogram from "./metric/histogram";
import Metric, { type Labels } from "./metric/metric";
import { defaultFormatter, type MetricFormatter } from "./format";
import type Collector from "./collector";
import { Aggregator } from "./aggregator";

export type MetricsRegistryConfig = {
  readonly defaultLabels?: Labels;
};

export default class MetricRegistry {
  private collectors: Collector[] = [];

  constructor(private readonly config: MetricsRegistryConfig = {}) {}

  public addCollector(collector: Collector) {
    this.collectors.push(collector);
  }

  public withLabels(labels?: Labels): MetricRegistry {
    const config = {
      ...this.config,
      defaultLabels: mergeLabels(this.config.defaultLabels, labels),
    };
    const registry = new MetricRegistry(config);
    this.collectors.push(registry);
    return registry;
  }

  public static readonly DEFAULT_REGISTRY = new MetricRegistry();

  private metrics: Map<string, Metric> = new Map();

  public register(metric: Metric) {
    this.metrics.set(metric.getHashKey(), metric);
  }

  public unregister(metric: Metric) {
    this.metrics.delete(metric.getHashKey());
  }

  public counter(name: string, labels?: Labels): Counter {
    labels = this.combinedLabels(labels);
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
    labels = this.combinedLabels(labels);
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
    labels = this.combinedLabels(labels);
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
    labels = this.combinedLabels(labels);
    const key = Metric.hashKey(name, labels);

    if (!this.metrics.has(key)) {
      const observer = new Observer(name, observeFn, labels);
      this.register(observer);
      return observer;
    } else {
      return this.metrics.get(key) as Observer;
    }
  }

  public collect<T extends Aggregator>(agg: T): T {
    for (const child of this.collectors) {
      child.collect(agg);
    }

    for (const metric of this.metrics.values()) {
      metric.collect(agg);
    }

    return agg;
  }

  private combinedLabels(labels?: Labels): Labels | undefined {
    return mergeLabels(this.config.defaultLabels, labels);
  }
}

function mergeLabels(a?: Labels, b?: Labels): Labels | undefined {
  if (a && b) {
    return { ...a, ...b };
  } else {
    return a || b;
  }
}
