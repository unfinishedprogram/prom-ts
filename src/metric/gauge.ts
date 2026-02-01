import { formatTimeSeries } from "../timeseries";
import Metric from "./metric";

export default class Gauge extends Metric {
  private value: number = 0;

  public set(value: number): void {
    this.value = value;
  }

  getValue(): number {
    return this.value;
  }

  collect(): string {
    return formatTimeSeries(this.name, this.value, this.labels);
  }
}
