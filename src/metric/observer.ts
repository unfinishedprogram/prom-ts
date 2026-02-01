import Scalar from "./scalar";

export default class Observer extends Scalar {
  override metricType = "gauge" as const;
  public constructor(
    name: string,
    private readonly observeFn: () => number,
    labels?: Readonly<Record<string, string>>,
    description?: string,
  ) {
    super(name, labels, description);
  }

  get value(): number {
    return this.observeFn();
  }
}
