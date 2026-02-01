import { Aggregator } from "../aggregator";

export default class TestAggregator extends Aggregator {
  public getMetric(identifier: string) {
    return this.samples.find((s) => {
      const key = stringifySampleKey(s.name, s.labels);
      console.log(key, identifier);

      return stringifySampleKey(s.name, s.labels) === identifier;
    });
  }

  public getMeta(name: string) {
    return this.metadata.find((m) => m.name === name);
  }
}

function stringifySampleKey(name: string, labels?: Record<string, string>) {
  if (labels && Object.keys(labels).length > 0) {
    return `${name}${JSON.stringify(labels)}`;
  } else {
    return name;
  }
}
