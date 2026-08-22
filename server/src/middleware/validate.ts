import { Request, Response, NextFunction } from "express";
import { ZodObject } from "zod";
import { sendError } from "../utils/errors";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validate(schema: ZodObject<any>) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        });

        if (!result.success) {
            const details = result.error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
            }));
            sendError(
                res,
                400,
                "VALIDATION_ERROR",
                result.error.issues[0].message,
                details,
            );
            return;
        }

        if (result.data.body) req.body = result.data.body;
        if (result.data.params)
            req.params = result.data.params as Record<string, string>;
        if (result.data.query) {
            Object.defineProperty(req, "query", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: result.data.query as unknown as typeof req.query,
            });
        }

        next();
    };
}
