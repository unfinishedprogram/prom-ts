import {
  BaseAggregator,
  type CounterSample,
  type GaugeSample,
  type HistogramSample,
  type MetricFamily,
} from "../aggregator";

const isHistogram = (
  sample: [string, any],
): sample is [string, MetricFamily<HistogramSample>] =>
  sample[1].type === "histogram";

const isCounter = (
  sample: [string, any],
): sample is [string, MetricFamily<CounterSample>] =>
  sample[1].type === "counter";

const isGauge = (
  sample: [string, any],
): sample is [string, MetricFamily<GaugeSample>] => sample[1].type === "gauge";

export class TestAggregator extends BaseAggregator {
  get histograms(): Record<string, MetricFamily<HistogramSample>> {
    return Object.fromEntries(Object.entries(this.metrics).filter(isHistogram));
  }

  get counters(): Record<string, MetricFamily<CounterSample>> {
    return Object.fromEntries(Object.entries(this.metrics).filter(isCounter));
  }

  get gauges(): Record<string, MetricFamily<GaugeSample>> {
    return Object.fromEntries(Object.entries(this.metrics).filter(isGauge));
  }
}
