
# @n4nlabs/schooltrack-core

Core library for Hono-based microservices used in the Hono platform, maintained by N4nLabs.

## 📚 Overview

This library provides utilities specifically designed to standardize and simplify backend development with Hono.


## 🚀 Getting Started

### Installation

This package is published on NPM under the `@n4nlabs` scope. To install, run:

```bash
bun add @n4nlabs/hono-kit
```

or

```bash
npm install @n4nlabs/hono-kit
```

## 📦 Usage

You can import core functionalities along with helpful utilities such as environment validation, a logger, and custom error classes:

```ts
import { createEnv } from "@n4nlabs/schooltrack-core/utils";
import { Hono } from "hono";
import { z } from "zod/v4";

const { env, schema } = createEnv({
	AWS_REGION: z.string().default("us-east-1"),
	MODE: z.enum(["dev", "test", "prod"]).default("dev"),
	PORT: z.coerce.number().default(80),
});

type Schema = z.infer<typeof schema>;

const app = new Hono<{
	Variables: {
		env: Schema;
	};
}>();

app.use(async (c, next) => {
	c.set("env", env);
	await next();
});

Bun.serve({
	fetch: (request, server) => app.fetch(request, { server }),
});
```

### Accessing Environment Variables

You can access environment variables in two ways depending on the context:

#### Outside Hono Context (`env`)

Useful for configuration, logging, or service initialization:

```ts
logger.info(`Server started on port ${env.PORT} in ${env.MODE} mode`);
```

#### Inside Hono Context (`c.env`)

Provides type-safe access within route handlers or middleware:

```ts
app.get("/health", (c) => {
	const region = c.env.env.AWS_REGION;
	return c.text(`Running in region: ${region}`);
});
```

This approach ensures consistent and type-safe usage of environment variables throughout your application.
