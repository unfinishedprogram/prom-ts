import Scalar from "./scalar";

export default class Observer extends Scalar {
  public constructor(
    name: string,
    private readonly observeFn: () => number,
    labels?: Readonly<Record<string, string>>,
  ) {
    super(name, labels);
  }

  get value(): number {
    return this.observeFn();
  }
}
