import { expect, it } from "vitest";
import { jsonRequest } from "./api";
it("limita o corpo real sem confiar em Content-Length", async () => {
  const request = new Request("http://localhost/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "a".repeat(65536) }) });
  expect(request.headers.has("content-length")).toBe(false);
  await expect(jsonRequest(request)).rejects.toMatchObject({ status: 413 });
});
it("rejeita JSON inválido e aceita JSON com charset", async () => {
  const request = (body: string) => new Request("http://localhost/api", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body });
  await expect(jsonRequest(request("{"))).rejects.toMatchObject({ status: 400 });
  await expect(jsonRequest(request('{"ok":true}'))).resolves.toEqual({ ok: true });
});
