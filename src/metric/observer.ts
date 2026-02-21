import Scalar from "./scalar";

export default class Observer extends Scalar {
  public constructor(
    name: string,
    private readonly observeFn: () => number,
    type: "gauge" | "counter" = "gauge",
    labels?: Readonly<Record<string, string>>,
  ) {
    super(name, type, labels);
  }

  get value(): number {
    return this.observeFn();
  }
}
