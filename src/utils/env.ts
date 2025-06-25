import { getRuntimeKey } from "hono/adapter";
import { z } from "zod/v4";

const runtimeEnv = getRuntimeKey() === "bun" ? Bun.env : process.env;

export function createEnv<T extends z.ZodRawShape>(
	bindings: T,
	sourceEnv: Record<string, string | undefined> = runtimeEnv,
) {
	const schema = z.object(bindings);
	const result = schema.safeParse(sourceEnv);

	if (!result.success) {
		const formatted = result.error.issues.map((issue) => {
			const envName = issue.path.join(".");
			const currentValue = sourceEnv[issue.path.at(-1)?.toString() ?? ""];
			return `[${envName}] is ${currentValue} (${issue.message})`;
		});

		throw new Error(["Environment variables validation failed.", ...formatted].join("\n"));
	}

	return {
		env: result.data as z.infer<typeof schema>,
		schema,
	};
}
