import { SimpleAggregator } from "../src/aggregator";
import MetricRegistry from "../src/metricRegistry";

type BenchConfig = {
  batchSize: number;
  iterations: number;
};

const CONFIG = {
  batchSize: 1000,
  iterations: 100,
} satisfies BenchConfig;

type BenchResult = {
  nanoPerOperation: number;
};

function bench<T>(
  initState: () => T,
  fn: (state: T) => void,
  config: BenchConfig = CONFIG,
): BenchResult {
  Bun.gc(true);
  const warmupState = initState();
  for (let i = 0; i < config.iterations; i++) {
    for (let j = 0; j < config.batchSize; j++) {
      fn(warmupState);
    }
  }

  const state = initState();
  const start = Bun.nanoseconds();
  for (let i = 0; i < config.iterations; i++) {
    for (let j = 0; j < config.batchSize; j++) {
      fn(state);
    }
  }
  const end = Bun.nanoseconds();

  const duration = end - start;
  const totalOps = config.iterations * config.batchSize;
  const nanoPerOperation = duration / totalOps;
  Bun.gc(true);

  return { nanoPerOperation };
}

const runBenchmarks = () => {
  return {
    "counter inc cached instance": bench(
      () => {
        const registry = new MetricRegistry();
        const counter = registry.counter("requests_total", {
          method: "GET",
          status: "200",
        });
        return counter;
      },
      (counter) => {
        counter.inc();
      },
    ),
    "counter inc cached instance 2": bench(
      () => {
        const registry = new MetricRegistry();
        const counter = registry.counter("requests_total", {
          method: "GET",
          status: "200",
        });
        return counter;
      },
      (counter) => {
        counter.inc();
      },
    ),
    "counter inc refetch instance": bench(
      () => new MetricRegistry(),
      (registry) => {
        registry.counter("requests_total", {
          method: "GET",
          status: "200",
        }).inc();
      },
    ),
    "counter inc refetch instance no labels": bench(
      () => new MetricRegistry(),
      (registry) => {
        registry.counter("requests_total").inc();
      },
    ),
    "counter inc cache instance no labels": bench(
      () => {
        const registry = new MetricRegistry();
        const counter = registry.counter("requests_total");
        return counter;
      },
      (counter) => {
        counter.inc();
      },
    ),
    "collect_metrics": bench(
      () => {
        const registry = new MetricRegistry();
        const counter1 = registry.counter("requests_total", {
          method: "GET",
          status: "200",
        });
        const counter2 = registry.counter("requests_total", {
          method: "POST",
          status: "201",
        });
        for (let i = 0; i < 100; i++) {
          counter1.inc();
          counter2.inc(2);
        }
        const aggregator = new SimpleAggregator();
        return [registry, aggregator] as const;
      },
      ([registry, aggregator]) => {
        registry.aggregate(aggregator);
      },
    ),
    "histogram observe": bench(
      () => {
        const registry = new MetricRegistry();
        const histogram = registry.histogram("request_duration_seconds", {
          method: "GET",
          status: "200",
        });
        return histogram;
      },
      (histogram) => {
        histogram.observe(Math.random() * 10);
      },
    ),
  };
};

console.table(runBenchmarks());
console.table(runBenchmarks());
console.table(runBenchmarks());
console.table(runBenchmarks());
