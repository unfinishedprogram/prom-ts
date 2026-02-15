import { SimpleAggregator } from "../aggregator";

export default class TestAggregator extends SimpleAggregator {
  constructor() {
    super();
  }

  public getMetric(identifier: string) {
    return this.samples.find((s) => {
      const key = stringifySampleKey(s.name, s.labels);
      return key === identifier;
    });
  }

  public getMeta(name: string) {
    return this.metadata.find((m) => m.name === name);
  }
}

const stringifySampleKey = (name: string, labels?: Record<string, string>) => {
  if (labels && Object.keys(labels).length > 0) {
    return `${name}${JSON.stringify(labels)}`;
  } else {
    return name;
  }
};
