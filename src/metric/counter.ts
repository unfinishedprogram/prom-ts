import { formatTimeSeries } from "../timeseries";
import Collector from "./metric";

export default class Counter extends Collector {
  private value: number = 0;

  public inc(value: number = 1): void {
    if (value < 0) return;
    this.value += value;
  }

  getValue(): number {
    return this.value;
  }

  collect(): string {
    return formatTimeSeries(this.name, this.value, this.labels);
  }
}
