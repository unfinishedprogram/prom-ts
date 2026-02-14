import type { Aggregator } from "./aggregator";

export default interface Collector {
  aggregate(agg: Aggregator): void;
}
