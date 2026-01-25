type Labels = Readonly<Record<string, string>>;

export default class Metric {
  constructor(readonly name: string, readonly labels?: Labels) {}

  public getHashKey(): string {
    return Metric.hashKey(this.name, this.labels);
  }

  public static hashKey(name: string, labels?: Labels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const keys = Object.keys(labels).sort();
    const labelParts = keys.map((key) => `${key}=${labels[key]}`);
    return `${name}|${labelParts.join(",")}`;
  }
}
