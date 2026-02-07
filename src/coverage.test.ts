import { test } from "bun:test";
import { importAllModules } from "./test/importAllModules";

test("imports all modules for coverage", async () => {
  await importAllModules(import.meta.dir);
});
