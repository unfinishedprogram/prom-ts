import type { MetricFormatter } from "./format";

export default interface Collector {
  collect(formatter?: MetricFormatter): string;
}
