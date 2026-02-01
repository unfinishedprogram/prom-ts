import { defaultFormatter, type MetricFormatter } from "../format";
import Metric from "./metric";

export default abstract class Scalar extends Metric {
  public abstract readonly value: number;

  constructor(
    name: string,
    labels?: Record<string, string>,
  ) {
    super(name, labels);
  }

  collect(formatter: MetricFormatter = defaultFormatter): string {
    const metadata = formatter.metadata(
      this.name,
      this.metricType,
      this.description,
    );
    const timeseries = formatter.timeseries(this.name, this.value, this.labels);
    return metadata + timeseries;
  }
}
