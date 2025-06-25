import { createEnv } from "@/utils/env";
import { describe, expect, it } from "bun:test";
import { z } from "zod/v4";

describe("createEnv", () => {
	it("should return valid env when all variables are present", () => {
		const bindings = {
			DATABASE_URL: z.string(),
			PORT: z.string().transform(Number),
			NODE_ENV: z.enum(["development", "production", "test"]),
		};

		const mockEnv = {
			DATABASE_URL: "postgres://username:password@host:port/dbname",
			PORT: "3000",
			NODE_ENV: "development",
		};

		const result = createEnv(bindings, mockEnv);

		expect(result.env).toEqual({
			DATABASE_URL: "postgres://username:password@host:port/dbname",
			PORT: 3000,
			NODE_ENV: "development",
		});
		expect(result.schema).toBeDefined();
	});

	it("should use Bun.env as default source", () => {
		const mockEnvWithTestVar = {
			...Bun.env,
			TEST_VAR: "test_value",
		};

		const bindings = {
			TEST_VAR: z.string(),
		};

		const result = createEnv(bindings, mockEnvWithTestVar);
		expect(result.env.TEST_VAR).toBe("test_value");
	});

	it("should throw error when required variable is missing", () => {
		const bindings = {
			REQUIRED_VAR: z.string(),
			OPTIONAL_VAR: z.string().optional(),
		};

		const mockEnv = {
			OPTIONAL_VAR: "present",
		};

		expect(() => {
			createEnv(bindings, mockEnv);
		}).toThrow("Environment variables validation failed.");
	});

	it("should throw error with detailed validation messages", () => {
		const bindings = {
			DATABASE_URL: z.string().url(),
			PORT: z.string().regex(/^\d+$/, "Must be numeric"),
			NODE_ENV: z.enum(["development", "production"]),
		};

		const mockEnv = {
			DATABASE_URL: "invalid-url",
			PORT: "not-a-number",
		};

		try {
			createEnv(bindings, mockEnv);
		} catch (error) {
			const message = (error as Error).message;

			expect(message).toContain("Environment variables validation failed.");
			expect(message).toContain("[DATABASE_URL] is invalid-url");
			expect(message).toContain("[PORT] is not-a-number");
			expect(message).toContain("[NODE_ENV] is undefined");
		}
	});

	it("should handle undefined values correctly", () => {
		const bindings = {
			DEFINED_VAR: z.string(),
			UNDEFINED_VAR: z.string(),
		};

		const mockEnv = {
			DEFINED_VAR: "value",
			UNDEFINED_VAR: undefined,
		};

		expect(() => {
			createEnv(bindings, mockEnv);
		}).toThrow();
	});

	it("should work with complex zod schemas", () => {
		const bindings = {
			API_KEY: z.string().min(10),
			MAX_CONNECTIONS: z.string().transform(Number).pipe(z.number().positive()),
			FEATURES: z.string().transform((val) => val.split(",")),
			DEBUG: z
				.string()
				.transform((val) => val === "true")
				.pipe(z.boolean()),
		};

		const mockEnv = {
			API_KEY: "super-secret-key",
			MAX_CONNECTIONS: "100",
			FEATURES: "auth,payments,analytics",
			DEBUG: "true",
		};

		const result = createEnv(bindings, mockEnv);

		expect(result.env).toEqual({
			API_KEY: "super-secret-key",
			MAX_CONNECTIONS: 100,
			FEATURES: ["auth", "payments", "analytics"],
			DEBUG: true,
		});
	});

	it("should handle nested path errors correctly", () => {
		const bindings = {
			"NESTED.VALUE": z.string(),
		};

		const mockEnv = {
			"NESTED.VALUE": undefined,
		};

		try {
			createEnv(bindings, mockEnv);
		} catch (error) {
			const message = (error as Error).message;
			expect(message).toContain("[NESTED.VALUE] is undefined");
		}
	});

	it("should return correct TypeScript types", () => {
		const bindings = {
			STRING_VAR: z.string(),
			NUMBER_VAR: z.string().transform(Number),
			BOOLEAN_VAR: z.string().transform((val) => val === "true"),
		} as const;

		const mockEnv = {
			STRING_VAR: "text",
			NUMBER_VAR: "42",
			BOOLEAN_VAR: "true",
		};

		const result = createEnv(bindings, mockEnv);

		const stringVar: string = result.env.STRING_VAR;
		const numberVar: number = result.env.NUMBER_VAR;
		const booleanVar: boolean = result.env.BOOLEAN_VAR;

		expect(typeof stringVar).toBe("string");
		expect(typeof numberVar).toBe("number");
		expect(typeof booleanVar).toBe("boolean");
	});
});
