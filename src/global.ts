import { Bindings } from "hono/types";

declare global {
	interface Env {
		Variables: {};
		Bindings: Bindings;
	}
}
