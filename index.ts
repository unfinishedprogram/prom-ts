import Counter from "./src/metric/counter";
import Gauge from "./src/metric/gauge";
import Histogram from "./src/metric/histogram";
import Observer from "./src/metric/observer";

import MetricRegistry from "./src/collector_registry";
import Metric from "./src/metric/metric";

export { Counter, Gauge, Histogram, Observer };
export { Metric, MetricRegistry };

export default MetricRegistry.DEFAULT_REGISTRY;
