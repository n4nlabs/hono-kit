import { $ } from "bun";
import { readdirSync, statSync } from "fs";
import { join } from "path";

function isTestFile(path: string): boolean {
	return /\.(test|spec)\.(ts)$/.test(path) || path.includes("__tests__") || path.includes("/tests/");
}

function findEntrypoints(dir: string, eps: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);

		if (statSync(full).isDirectory()) {
			findEntrypoints(full, eps);
		} else if (name === "index.ts") {
			if (!isTestFile(name) && !isTestFile(full)) {
				eps.push(full);
			}
		}
	}

	return eps;
}

await Bun.build({
	entrypoints: findEntrypoints("src"),
	outdir: "dist",
	splitting: true,
	minify: true,
	external: ["hono", "zod"],
});

await $`tsc --project tsconfig.build.json`;
await $`tsc-alias -p tsconfig.build.json`;

console.log("✅ Build complete!");
