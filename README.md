# prom-ts

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.6. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## Bench Results

### Baseline
┌────────────────────────────────────────┬──────────────────┐
│                                        │ nanoPerOperation │
├────────────────────────────────────────┼──────────────────┤
│            counter inc cached instance │ 4.164487         │
│          counter inc cached instance 2 │ 4.122789         │
│           counter inc refetch instance │ 298.488152       │
│ counter inc refetch instance no labels │ 7.237608         │
│   counter inc cache instance no labels │ 4.395059         │
└────────────────────────────────────────┴──────────────────┘
