export default class Gauge {
  private value: number = 0;

  public set(value: number): void {
    this.value = value;
  }
}
