import { Error, ErrorResponseException, ErrorResponseSchema } from "@/exceptions/error";
import { describe, expect, it } from "bun:test";

describe("Error", () => {
	it("should create an Error instance with field and message", () => {
		const error = new Error("email", "Email is required");

		expect(error.field).toBe("email");
		expect(error.message).toBe("Email is required");
	});
});

describe("ErrorResponseException", () => {
	it("should create exception with status only", () => {
		const exception = new ErrorResponseException({ status: 400 });

		expect(exception.status).toBe(400);
		expect(exception.errors).toEqual([]);
	});

	it("should create exception with all parameters", () => {
		const errors = [new Error("email", "Invalid email")];
		const exception = new ErrorResponseException({
			status: 422,
			errors,
			title: "Validation Error",
			message: "Request validation failed",
		});

		expect(exception.status).toBe(422);
		expect(exception.errors).toEqual(errors);
	});

	it("should generate correct response", async () => {
		const errors = [new Error("name", "Name is required")];
		const exception = new ErrorResponseException({
			status: 400,
			errors,
			title: "Bad Request",
			message: "Invalid input",
		});

		const response = exception.getResponse();
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(response.headers.get("Content-Type")).toBe("application/json");
		expect(body).toEqual({
			status: 400,
			title: "Bad Request",
			message: "Invalid input",
			errors: [{ field: "name", message: "Name is required" }],
		});
	});

	describe("builder pattern", () => {
		it("should create exception using builder with status only", () => {
			const exception = ErrorResponseException.builder(404).build();

			expect(exception.status).toBe(404);
			expect(exception.errors).toEqual([]);
		});

		it("should create exception using builder with all methods", () => {
			const errors = [new Error("id", "ID not found")];
			const exception = ErrorResponseException.builder(404)
				.errors(errors)
				.title("Not Found")
				.message("Resource not found")
				.build();

			expect(exception.status).toBe(404);
			expect(exception.errors).toEqual(errors);
		});

		it("should allow method chaining", () => {
			const exception = ErrorResponseException.builder(422)
				.title("Validation Failed")
				.message("Input validation error")
				.errors([new Error("email", "Invalid format")])
				.build();

			expect(exception.status).toBe(422);
		});
	});
});

describe("ErrorResponseSchema", () => {
	it("should validate correct error response", () => {
		const validResponse = {
			status: 400,
			title: "Bad Request",
			message: "Invalid input",
			errors: [{ field: "email", message: "Email is required" }],
		};

		const result = ErrorResponseSchema.safeParse(validResponse);
		expect(result.success).toBe(true);
	});

	it("should reject invalid status codes", () => {
		const invalidResponse = {
			status: 99,
			title: "Error",
			message: "Message",
			errors: [],
		};

		const result = ErrorResponseSchema.safeParse(invalidResponse);
		expect(result.success).toBe(false);
	});

	it("should reject missing required fields", () => {
		const invalidResponse = {
			status: 400,
			errors: [],
		};

		const result = ErrorResponseSchema.safeParse(invalidResponse);
		expect(result.success).toBe(false);
	});

	it("should validate empty errors array", () => {
		const validResponse = {
			status: 500,
			title: "Internal Error",
			message: "Something went wrong",
			errors: [],
		};

		const result = ErrorResponseSchema.safeParse(validResponse);
		expect(result.success).toBe(true);
	});
});

describe("Integration tests", () => {
	it("should create exception and validate response with schema", async () => {
		const exception = ErrorResponseException.builder(422)
			.title("Validation Error")
			.message("Request validation failed")
			.errors([new Error("email", "Email is required"), new Error("password", "Password too weak")])
			.build();

		const response = exception.getResponse();
		const body = await response.json();

		const validation = ErrorResponseSchema.safeParse(body);
		expect(validation.success).toBe(true);
		expect(body.errors).toHaveLength(2);
	});
});
