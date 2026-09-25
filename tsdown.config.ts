import { defineConfig } from "tsdown"
import { readFileSync } from "fs"
import path from "path"

const { compilerOptions } = JSON.parse(readFileSync("./tsconfig.json", "utf-8"))
const aliases = Object.fromEntries(
  Object.entries(compilerOptions.paths as Record<string, string[]>).map(([key, [value]]) => [
    key.replace("/*", ""),
    path.resolve(value.replace("/*", ""))
  ])
)

export default defineConfig({
  entry: {
    index: "src/index.ts",
    types: "src/type/index.ts",
    errors: "src/error/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "node18",
  alias: aliases
})
