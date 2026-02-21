import Scalar from "./scalar";

export default class Counter extends Scalar {
  private _value: number = 0;

  constructor(name: string, labels?: Record<string, string>) {
    super(name, "counter", labels);
  }

  public inc(value: number = 1): void {
    if (value < 0) return;
    this._value += value;
  }

  get value(): number {
    return this._value;
  }
}
