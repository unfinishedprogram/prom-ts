import type { Aggregator } from "./aggregator";

export default interface Collector {
  aggregate<T extends Aggregator>(agg: T): T;
}
