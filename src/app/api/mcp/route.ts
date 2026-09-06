import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { resolveApiKey } from "@/lib/api-keys";
import { buildMcpServer } from "@/lib/mcp/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Mesma coisa que /api/mcp/<chave>, mas com a chave em Authorization: Bearer. */
async function handle(req: Request) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? new URL(req.url).searchParams.get("key");
  const profile = await resolveApiKey(bearer);
  if (!profile) {
    return Response.json({ jsonrpc: "2.0", error: { code: -32001, message: "Chave API inválida. Use /api/mcp/<chave> ou Authorization: Bearer <chave>." }, id: null }, { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="deslizaia"' } });
  }
  const server = buildMcpServer(profile);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  // Não feche o transport aqui: veja o comentário em [key]/route.ts.
  return transport.handleRequest(req);
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
