import { formatTimeSeries } from "../timeseries";
import Metric from "./metric";

export default abstract class Scalar extends Metric {
  public abstract readonly value: number;

  collect(): string {
    return formatTimeSeries(this.name, this.value, this.labels);
  }
}
