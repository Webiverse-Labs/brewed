//an error that carries an HTTP status, so controllers can `throw new ApiError(404, "Café not found")`
//and errorMiddleware sends it back as { message, code? } with that status
export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
