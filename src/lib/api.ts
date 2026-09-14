import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof ZodError)
    return Response.json(
      {
        error: "Dados inválidos.",
        details: error.issues.map(({ path, message }) => ({
          field: path.join("."),
          message,
        })),
      },
      { status: 400 },
    );
  if (error instanceof ApiError)
    return Response.json({ error: error.message }, { status: error.status });
  console.error("Erro de API", error);
  return Response.json(
    { error: "Não foi possível processar a solicitação." },
    { status: 500 },
  );
}

export function jsonRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json"))
    throw new ApiError(415, "Use Content-Type: application/json.");
  return request.json();
}
