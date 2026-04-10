import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function bumpPatch(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Unsupported version format: ${version}`);
  }

  const [, major, minor, patch] = match;
  return `${major}.${minor}.${Number(patch) + 1}`;
}

async function updateJsonFile(filePath, transform) {
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  const updated = transform(parsed);
  await writeFile(filePath, `${JSON.stringify(updated, null, 2)}\n`);
}

const packageJsonPath = path.join(repoRoot, "package.json");
const packageLockPath = path.join(repoRoot, "package-lock.json");

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const nextVersion = bumpPatch(packageJson.version);

await updateJsonFile(packageJsonPath, (data) => ({
  ...data,
  version: nextVersion,
}));

await updateJsonFile(packageLockPath, (data) => ({
  ...data,
  version: nextVersion,
  packages: {
    ...data.packages,
    "": {
      ...data.packages[""],
      version: nextVersion,
    },
  },
}));

process.stdout.write(`${packageJson.version} -> ${nextVersion}\n`);
