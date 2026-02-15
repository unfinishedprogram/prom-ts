const DEFAULT_EXCLUDE = [".test.ts", ".d.ts"];

// Required for proper coverage. Bun only tracks coverage for imported modules
export async function importAllModules(
  dir: string,
  exclude: string[] = [],
): Promise<void> {
  const allExclude = [...DEFAULT_EXCLUDE, ...exclude];
  const glob = new Bun.Glob("**/*.ts");
  const files = [...glob.scanSync(dir)].filter(
    (f) => !allExclude.some((pattern) => f.endsWith(pattern)),
  );

  await Promise.all(
    files.map((relPath) => import(new URL(relPath, `file://${dir}/`).href)),
  );
}
