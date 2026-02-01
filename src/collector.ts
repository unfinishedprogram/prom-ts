import type { Aggregator } from "./aggregator";

export default interface Collector {
  collect<T extends Aggregator>(agg: T): T;
}
