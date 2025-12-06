export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
}

// Convenience factory functions
export const BadRequest = (message: string) => new HttpError(400, message);
export const Unauthorized = (message: string) => new HttpError(401, message);
export const Forbidden = (message: string) => new HttpError(403, message);
export const NotFound = (message: string) => new HttpError(404, message);
export const Conflict = (message: string) => new HttpError(409, message);
export const InternalServerError = (message: string) => new HttpError(500, message);
