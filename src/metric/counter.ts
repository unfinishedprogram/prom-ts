import type { MetricType } from "./metric";
import Scalar from "./scalar";

export default class Counter extends Scalar {
  private _value: number = 0;
  override metricType = "counter" as const;

  public inc(value: number = 1): void {
    if (value < 0) return;
    this._value += value;
  }

  get value(): number {
    return this._value;
  }
}
