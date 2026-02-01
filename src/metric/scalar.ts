import { defaultFormatter, type TimeseriesFormatter } from "../format";
import Metric from "./metric";

export default abstract class Scalar extends Metric {
  public abstract readonly value: number;

  collect(formatter: TimeseriesFormatter = defaultFormatter): string {
    return formatter(this.name, this.value, this.labels);
  }
}
