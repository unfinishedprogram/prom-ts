import { defaultFormatter, type MetricFormatter } from "./format";
import { mergeLabels } from "./util";
import type { Labels } from "./metric/metric";
import type {
  Aggregator,
  CounterSample,
  GaugeSample,
  HistogramSample,
  MetricSample,
} from "./aggregator.type";

export type AggregateSample = {
  value: number;
  labels?: Record<string, string>;
};

type MetricFamily<T extends MetricSample = MetricSample> = {
  name: string;
  type: T["type"];
  description?: string;
  samples: T[];
};

export class BaseAggregator implements Aggregator {
  public readonly metrics: Record<string, MetricFamily> = {};

  constructor() {}

  observe(sample: MetricSample) {
    const family = this.metrics[sample.name];
    if (family) {
      family.samples.push(sample);
    } else {
      this.metrics[sample.name] = {
        name: sample.name,
        type: sample.type,
        description: sample.description,
        samples: [sample],
      };
    }
  }

  private formatHistogramSample(
    formatter: MetricFormatter,
    sample: HistogramSample,
  ): string {
    let result = "";
    const bucketName = `${sample.name}_bucket`;

    for (const { le, count } of sample.buckets) {
      result += formatter.timeseries(
        bucketName,
        count,
        { ...sample.labels, le },
      );
    }

    result += formatter.timeseries(
      `${sample.name}_count`,
      sample.count,
      sample.labels,
    );
    result += formatter.timeseries(
      `${sample.name}_sum`,
      sample.sum,
      sample.labels,
    );
    result += formatter.timeseries(
      `${sample.name}_min`,
      sample.min,
      sample.labels,
    );
    result += formatter.timeseries(
      `${sample.name}_max`,
      sample.max,
      sample.labels,
    );

    return result;
  }

  private formatScalarSample(
    formatter: MetricFormatter,
    sample: CounterSample | GaugeSample,
  ): string {
    return formatter.timeseries(sample.name, sample.value, sample.labels);
  }

  format(formatter: MetricFormatter): string {
    let result = "";

    for (const [name, family] of Object.entries(this.metrics)) {
      result += formatter.metadata(name, family.type, family.description);

      for (const sample of family.samples) {
        if (sample.type === "histogram") {
          result += this.formatHistogramSample(formatter, sample);
        } else {
          result += this.formatScalarSample(formatter, sample);
        }
      }
    }

    return result;
  }

  toString() {
    return this.format(defaultFormatter);
  }
}

export class LabelingAggregator implements Aggregator {
  constructor(
    private readonly baseAggregator: Aggregator,
    readonly defaultLabels: Labels = {},
  ) {}

  observe(sample: MetricSample) {
    this.baseAggregator.observe({
      ...sample,
      labels: mergeLabels(this.defaultLabels, sample.labels),
    });
  }

  format(formatter: MetricFormatter): string {
    return this.baseAggregator.format(formatter);
  }
}
