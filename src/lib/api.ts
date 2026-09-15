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

export async function jsonRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.split(";")[0].trim().toLowerCase() !== "application/json")
    throw new ApiError(415, "Use Content-Type: application/json.");
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 65_536)
    throw new ApiError(413, "Corpo da solicitação é muito grande.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "JSON inválido.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 65_536) {
        await reader.cancel();
        throw new ApiError(413, "Corpo da solicitação é muito grande.");
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "JSON inválido.");
  } finally { reader.releaseLock(); }
}
