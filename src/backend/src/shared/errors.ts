export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export function assertFound<T>(value: T | undefined | null, message = "Resource not found"): T {
  if (value === undefined || value === null) {
    throw new AppError(404, "NOT_FOUND", message);
  }

  return value;
}
