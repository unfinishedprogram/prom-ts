import Gauge from "./gauge";

export default class Observer extends Gauge {
  public constructor(
    name: string,
    private readonly observeFn: () => number,
    labels?: Readonly<Record<string, string>>,
  ) {
    super(name, labels);
  }

  override get value(): number {
    return this.observeFn();
  }
}
