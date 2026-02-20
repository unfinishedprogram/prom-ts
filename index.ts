import Counter from "./src/metric/counter";
import Gauge from "./src/metric/gauge";
import Histogram from "./src/metric/histogram";
import Observer from "./src/metric/observer";
import type Collector from "./src/collector";

import MetricRegistry from "./src/metricRegistry";
import Metric from "./src/metric/metric";

import {
  registerServerMetrics,
  SystemMetricsCollector,
} from "./src/collectors/bun";

export {
  type Collector,
  Counter,
  Gauge,
  Histogram,
  Metric,
  MetricRegistry,
  Observer,
  registerServerMetrics,
  SystemMetricsCollector,
};

export default MetricRegistry.DEFAULT_REGISTRY;
