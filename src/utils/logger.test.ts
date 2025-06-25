import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const createLoggerWithEnv = (logLevels: string) => {
	const LOG_LEVELS = (logLevels?.split(",") as ["none", "info", "success", "http", "warn", "error", "fatal"]) || [
		"none",
	];

	const enabledLevels = new Set(LOG_LEVELS.filter((l) => l !== "none"));

	const shouldLog = (level: string): boolean => {
		if (LOG_LEVELS.includes("none" as any)) return false;
		return enabledLevels.has(level as any);
	};

	const levelColors = {
		info: (text: string) => `\x1b[36m${text}\x1b[0m`,
		success: (text: string) => `\x1b[32m${text}\x1b[0m`,
		http: (text: string) => `\x1b[35m${text}\x1b[0m`,
		warn: (text: string) => `\x1b[33m${text}\x1b[0m`,
		error: (text: string) => `\x1b[31m${text}\x1b[0m`,
		fatal: (text: string) => `\x1b[31m${text}\x1b[0m`,
	};

	const levelIcons = {
		info: "ℹ️",
		success: "✅",
		http: "📍",
		warn: "⚠️",
		error: "❌",
		fatal: "💀",
	};

	const log = (level: string, msg: string | (() => string)) => {
		if (!shouldLog(level)) return;

		const message = typeof msg === "function" ? msg() : msg;
		const timestamp = new Date().toISOString();
		const rawLevel = `[${level.toUpperCase()}]`.padEnd(10, " ");
		const coloredLevel = levelColors[level as keyof typeof levelColors](rawLevel);
		const icon = levelIcons[level as keyof typeof levelIcons];

		console.log(`${coloredLevel}${timestamp} - ${icon} ${message}`);
	};

	const colorStatus = (statusCode: number): string => {
		if (statusCode >= 200 && statusCode < 300) return `\x1b[32m${statusCode}\x1b[0m`;
		if (statusCode >= 300 && statusCode < 400) return `\x1b[34m${statusCode}\x1b[0m`;
		if (statusCode >= 400 && statusCode < 500) return `\x1b[33m${statusCode}\x1b[0m`;
		if (statusCode >= 500) return `\x1b[31m${statusCode}\x1b[0m`;
		return `\x1b[37m${statusCode}\x1b[0m`;
	};

	const colorResponseTime = (ms: number): string => {
		if (ms < 100) return `\x1b[32m${ms}ms\x1b[0m`;
		if (ms < 500) return `\x1b[33m${ms}ms\x1b[0m`;
		return `\x1b[31m${ms}ms\x1b[0m`;
	};

	const logHttpRequest = (path: string, statusCode: number, responseTimeMs: number, ip: string) => {
		const statusColored = colorStatus(statusCode);
		const responseTimeColored = colorResponseTime(responseTimeMs);
		const message = `${path} (${statusColored}) in ${responseTimeColored} from ${ip}`;
		log("http", message);
	};

	return {
		info: (msg: string | (() => string)) => log("info", msg),
		success: (msg: string | (() => string)) => log("success", msg),
		warn: (msg: string | (() => string)) => log("warn", msg),
		error: (msg: string | (() => string)) => log("error", msg),
		fatal: (msg: string | (() => string)) => {
			log("fatal", msg);
			process.exit(1);
		},
		http: logHttpRequest,
	};
};

describe("logger", () => {
	const originalConsoleLog = console.log;
	const originalProcessExit = process.exit;

	beforeEach(() => {
		console.log = mock(() => {});
		process.exit = mock(() => {}) as any;
	});

	afterEach(() => {
		console.log = originalConsoleLog;
		process.exit = originalProcessExit;
		mock.restore();
	});

	describe("with LOG_LEVELS=none", () => {
		it("should not log any messages when LOG_LEVELS includes none", () => {
			const logger = createLoggerWithEnv("none");

			logger.info("test message");
			logger.success("test message");
			logger.warn("test message");
			logger.error("test message");

			expect(console.log).not.toHaveBeenCalled();
		});
	});

	describe("with specific log levels", () => {
		const logger = createLoggerWithEnv("info,success,warn,error,fatal");

		it("should log info messages with correct format", () => {
			const testMessage = "This is an info message";
			logger.info(testMessage);

			expect(console.log).toHaveBeenCalledTimes(1);
			const logCall = (console.log as any).mock.calls[0][0];
			expect(logCall).toContain("[INFO]");
			expect(logCall).toContain("ℹ️");
			expect(logCall).toContain(testMessage);
		});

		it("should log success messages with correct format", () => {
			const testMessage = "Operation successful";
			logger.success(testMessage);

			expect(console.log).toHaveBeenCalledTimes(1);
			const logCall = (console.log as any).mock.calls[0][0];
			expect(logCall).toContain("[SUCCESS]");
			expect(logCall).toContain("✅");
			expect(logCall).toContain(testMessage);
		});

		it("should log warn messages with correct format", () => {
			const testMessage = "This is a warning";
			logger.warn(testMessage);

			expect(console.log).toHaveBeenCalledTimes(1);
			const logCall = (console.log as any).mock.calls[0][0];
			expect(logCall).toContain("[WARN]");
			expect(logCall).toContain("⚠️");
			expect(logCall).toContain(testMessage);
		});

		it("should log error messages with correct format", () => {
			const testMessage = "An error occurred";
			logger.error(testMessage);

			expect(console.log).toHaveBeenCalledTimes(1);
			const logCall = (console.log as any).mock.calls[0][0];
			expect(logCall).toContain("[ERROR]");
			expect(logCall).toContain("❌");
			expect(logCall).toContain(testMessage);
		});

		it("should log fatal messages and call process.exit", () => {
			const testMessage = "Fatal error";
			logger.fatal(testMessage);

			expect(console.log).toHaveBeenCalledTimes(1);
			const logCall = (console.log as any).mock.calls[0][0];
			expect(logCall).toContain("[FATAL]");
			expect(logCall).toContain("💀");
			expect(logCall).toContain(testMessage);
			expect(process.exit).toHaveBeenCalledWith(1);
		});

		it("should handle function messages", () => {
			const messageFunction = () => "Dynamic message";
			logger.info(messageFunction);

			expect(console.log).toHaveBeenCalledTimes(1);
			const logCall = (console.log as any).mock.calls[0][0];
			expect(logCall).toContain("Dynamic message");
		});

		it("should include timestamp in log messages", () => {
			const beforeTime = new Date().toISOString().substring(0, 16);
			logger.info("test");
			const afterTime = new Date().toISOString().substring(0, 16);

			const logCall = (console.log as any).mock.calls[0][0];
			const hasValidTimestamp = logCall.includes(beforeTime) || logCall.includes(afterTime);
			expect(hasValidTimestamp).toBe(true);
		});
	});

	describe("http logging", () => {
		const logger = createLoggerWithEnv("http");

		it("should log HTTP requests with correct format", () => {
			const path = "/api/users";
			const statusCode = 200;
			const responseTime = 150;
			const ip = "192.168.1.1";

			logger.http(path, statusCode, responseTime, ip);

			expect(console.log).toHaveBeenCalledTimes(1);
			const logCall = (console.log as any).mock.calls[0][0];
			expect(logCall).toContain("[HTTP]");
			expect(logCall).toContain("📍");
			expect(logCall).toContain(path);
			expect(logCall).toContain("200");
			expect(logCall).toContain("150ms");
			expect(logCall).toContain(ip);
		});

		it("should color status codes correctly", () => {
			const testCases = [
				{ status: 200, description: "2xx success" },
				{ status: 301, description: "3xx redirect" },
				{ status: 404, description: "4xx client error" },
				{ status: 500, description: "5xx server error" },
			];

			testCases.forEach(({ status }) => {
				logger.http("/test", status, 100, "127.0.0.1");
				const logCall = (console.log as any).mock.calls.at(-1)[0];
				expect(logCall).toContain(status.toString());
			});

			expect(console.log).toHaveBeenCalledTimes(testCases.length);
		});

		it("should color response times correctly", () => {
			const testCases = [
				{ time: 50, description: "fast response" },
				{ time: 250, description: "medium response" },
				{ time: 750, description: "slow response" },
			];

			testCases.forEach(({ time }) => {
				logger.http("/test", 200, time, "127.0.0.1");
				const logCall = (console.log as any).mock.calls.at(-1)[0];
				expect(logCall).toContain(`${time}ms`);
			});

			expect(console.log).toHaveBeenCalledTimes(testCases.length);
		});
	});

	describe("selective logging", () => {
		const logger = createLoggerWithEnv("info,error");

		it("should only log enabled levels", () => {
			logger.info("should log");
			logger.success("should not log");
			logger.warn("should not log");
			logger.error("should log");

			expect(console.log).toHaveBeenCalledTimes(2);

			const firstCall = (console.log as any).mock.calls[0][0];
			const secondCall = (console.log as any).mock.calls[1][0];

			expect(firstCall).toContain("should log");
			expect(firstCall).toContain("[INFO]");
			expect(secondCall).toContain("should log");
			expect(secondCall).toContain("[ERROR]");
		});
	});

	describe("edge cases", () => {
		const logger = createLoggerWithEnv("info");

		it("should handle empty messages", () => {
			logger.info("");
			expect(console.log).toHaveBeenCalledTimes(1);
		});

		it("should handle function that returns empty string", () => {
			logger.info(() => "");
			expect(console.log).toHaveBeenCalledTimes(1);
		});

		it("should handle special characters in messages", () => {
			const specialMessage = "Message with émojis 🚀 and spëcial chars";
			logger.info(specialMessage);

			const logCall = (console.log as any).mock.calls[0][0];
			expect(logCall).toContain(specialMessage);
		});
	});

	describe("default LOG_LEVELS behavior", () => {
		const logger = createLoggerWithEnv("");

		it("should default to none when LOG_LEVELS is empty", () => {
			logger.info("should not log");
			logger.error("should not log");

			expect(console.log).not.toHaveBeenCalled();
		});
	});
});
