import { Response } from "express";
import mongoose from "mongoose";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_ID"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "EMAIL_NOT_VERIFIED"
  | "INVALID_URL"
  | "BLOCKED_HOST"
  | "PREVIEW_UNAVAILABLE"
  | "INTERNAL_SERVER_ERROR";

export interface ApiErrorBody {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;
  readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Requisição inválida.", details?: unknown) {
    super(400, "BAD_REQUEST", message, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Dados inválidos.", details?: unknown) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado.") {
    super(404, "NOT_FOUND", message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autorizado.") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado.") {
    super(403, "FORBIDDEN", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflito com o estado atual do recurso.") {
    super(409, "CONFLICT", message);
  }
}

export function sendError(
  res: Response,
  statusCode: number,
  code: ErrorCode,
  message: string,
  details?: unknown,
): void {
  const body: ApiErrorBody = { success: false, error: { code, message } };
  if (details !== undefined) body.error.details = details;
  res.status(statusCode).json(body);
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(error.errors).map((e) => e.message);
    return new ValidationError(messages.join(". "), { fields: error.errors });
  }

  if (error instanceof mongoose.Error.CastError) {
    return new ValidationError("Formato de dado inválido.", {
      path: error.path,
      value: error.value,
    });
  }

  if (error instanceof Error) {
    return new AppError(500, "INTERNAL_SERVER_ERROR", "Erro interno do servidor.");
  }

  return new AppError(500, "INTERNAL_SERVER_ERROR", "Erro interno do servidor.");
}

export function handleMongooseError(error: unknown, res: Response, fallback: string): void {
  const appError = toAppError(error);
  if (appError.code === "INTERNAL_SERVER_ERROR") {
    sendError(res, 500, "INTERNAL_SERVER_ERROR", fallback);
    return;
  }
  sendError(res, appError.statusCode, appError.code, appError.message, appError.details);
}

export function handleError(error: unknown, res: Response, fallback = "Erro interno do servidor."): void {
  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.code, error.message, error.details);
    return;
  }
  handleMongooseError(error, res, fallback);
}
