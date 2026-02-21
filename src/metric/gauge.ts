import Scalar from "./scalar";

export default class Gauge extends Scalar {
  private _value: number = 0;

  constructor(name: string, labels?: Record<string, string>) {
    super(name, "gauge", labels);
  }

  public set(value: number): void {
    this._value = value;
  }

  get value(): number {
    return this._value;
  }
}
