import { HTTPException } from "hono/http-exception";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod/v4";

type ErrorResponseBuilderParams = {
	status: ContentfulStatusCode;
	errors?: Error[];
	title?: string;
	message?: string;
};

export class Error {
	constructor(
		public field: string,
		public message: string,
	) {
		this.field = field;
		this.message = message;
	}
}

export class ErrorResponseException extends HTTPException {
	private readonly _errors: Error[];
	private readonly _title?: string;
	private readonly _message?: string;

	constructor(params: ErrorResponseBuilderParams) {
		super(params.status);
		this._errors = params.errors ?? [];
		this._title = params.title;
		this._message = params.message;
	}

	get errors(): Error[] {
		return this._errors;
	}

	override getResponse = () => {
		const body = {
			status: this.status,
			title: this._title,
			message: this._message,
			errors: this._errors,
		};

		return new Response(JSON.stringify(body), {
			status: this.status,
			statusText: this.status.toString(),
			headers: { "Content-Type": "application/json" },
		});
	};

	static builder(status: ContentfulStatusCode) {
		return new ErrorResponseBuilder(status);
	}
}

class ErrorResponseBuilder {
	private _status: ContentfulStatusCode;
	private _errors: Error[] = [];
	private _title?: string;
	private _message?: string;

	constructor(status: ContentfulStatusCode) {
		this._status = status;
	}

	errors(errors: Error[]) {
		this._errors = errors;
		return this;
	}

	title(title: string) {
		this._title = title;
		return this;
	}

	message(message: string) {
		this._message = message;
		return this;
	}

	build() {
		return new ErrorResponseException({
			status: this._status,
			errors: this._errors,
			title: this._title,
			message: this._message,
		});
	}
}

export const ErrorResponseSchema = z
	.object({
		status: z.int().min(100).max(599),
		title: z.string(),
		message: z.string(),
		errors: z.array(
			z.object({
				field: z.string(),
				message: z.string(),
			}),
		),
	})
	.meta({
		id: "ErrorResponse",
		description: "Schema for error responses in Hono Kit",
	});
