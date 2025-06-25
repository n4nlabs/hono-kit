import { blue, bold, cyan, gray, green, magenta, red, white, yellow } from "colorette";

const LOG_LEVELS = (process.env.LOG_LEVELS?.split(",") as [
	"none",
	"info",
	"success",
	"http",
	"warn",
	"error",
	"fatal",
]) || ["none"];
export type LogLevel = (typeof LOG_LEVELS)[number];

const enabledLevels = new Set<LogLevel>(LOG_LEVELS.filter((l) => l !== "none"));

function shouldLog(level: Exclude<LogLevel, "none">): boolean {
	if (LOG_LEVELS.includes("none")) return false;
	return enabledLevels.has(level);
}

const levelColors: Record<Exclude<LogLevel, "none">, (text: string) => string> = {
	info: cyan,
	success: green,
	http: magenta,
	warn: yellow,
	error: red,
	fatal: red,
};

const levelIcons: Record<Exclude<LogLevel, "none">, string> = {
	info: "ℹ️",
	success: "✅",
	http: "📍",
	warn: "⚠️",
	error: "❌",
	fatal: "💀",
};

function log(level: Exclude<LogLevel, "none">, msg: string | (() => string)) {
	if (!shouldLog(level)) return;

	const message = typeof msg === "function" ? msg() : msg;
	const timestamp = new Date().toISOString();
	const rawLevel = `[${level.toUpperCase()}]`.padEnd(10, " ");
	const coloredLevel = levelColors[level](rawLevel);
	const icon = levelIcons[level];

	console.log(`${bold(coloredLevel)}${bold(gray(timestamp))} ${bold("-")} ${icon} ${message}`);
}

function colorStatus(statusCode: number): string {
	if (statusCode >= 200 && statusCode < 300) return green(`${statusCode}`);
	if (statusCode >= 300 && statusCode < 400) return blue(`${statusCode}`);
	if (statusCode >= 400 && statusCode < 500) return yellow(`${statusCode}`);
	if (statusCode >= 500) return red(`${statusCode}`);
	return white(`${statusCode}`);
}

function colorResponseTime(ms: number): string {
	if (ms < 100) return green(`${ms}ms`);
	if (ms < 500) return yellow(`${ms}ms`);
	return red(`${ms}ms`);
}

function logHttpRequest(path: string, statusCode: number, responseTimeMs: number, ip: string) {
	const statusColored = colorStatus(statusCode);
	const responseTimeColored = colorResponseTime(responseTimeMs);
	const message = `${path} (${statusColored}) in ${responseTimeColored} from ${ip}`;
	log("http", message);
}

export const logger = {
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
