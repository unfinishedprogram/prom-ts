import Scalar from "./scalar";

export default class Gauge extends Scalar {
  private _value: number = 0;
  override metricType = "gauge" as const;

  constructor(
    name: string,
    labels?: Record<string, string>,
    description?: string,
  ) {
    super(name, labels, description);
  }

  public set(value: number): void {
    this._value = value;
  }

  get value(): number {
    return this._value;
  }
}
