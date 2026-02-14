import Scalar from "./scalar";

export default class Observer extends Scalar {
  public constructor(
    name: string,
    private readonly observeFn: () => number,
    labels?: Readonly<Record<string, string>>,
  ) {
    super(name, labels);
  }

  #metricType: "gauge" | "counter" = "gauge";
  get metricType() {
    return this.#metricType;
  }

  public ofType(type: "gauge" | "counter"): this {
    this.#metricType = type;
    return this;
  }

  get value(): number {
    return this.observeFn();
  }
}
