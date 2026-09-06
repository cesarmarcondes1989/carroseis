import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { resolveApiKey } from "@/lib/api-keys";
import { buildMcpServer } from "@/lib/mcp/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Servidor MCP remoto (Streamable HTTP, stateless).
 * URL do conector: https://SEU-DOMINIO/api/mcp/<chave>
 * Também aceita a chave em Authorization: Bearer <chave> na rota /api/mcp.
 */
async function handle(req: Request, keyFromPath?: string) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const profile = await resolveApiKey(keyFromPath || bearer);
  if (!profile) {
    return Response.json({ jsonrpc: "2.0", error: { code: -32001, message: "Chave API inválida ou revogada." }, id: null }, { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="carrosseisia"' } });
  }
  const server = buildMcpServer(profile);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  // Não feche o transport aqui: handleRequest devolve o stream de resposta antes
  // da ferramenta terminar de rodar (o resultado chega depois, escrito nesse mesmo
  // stream). A própria lib fecha a conexão sozinha assim que a resposta é entregue;
  // fechar manualmente aqui corta o stream antes da resposta chegar.
  return transport.handleRequest(req);
}

type Ctx = { params: Promise<{ key: string }> };

export async function POST(req: Request, { params }: Ctx) {
  return handle(req, (await params).key);
}
export async function GET(req: Request, { params }: Ctx) {
  return handle(req, (await params).key);
}
export async function DELETE(req: Request, { params }: Ctx) {
  return handle(req, (await params).key);
}
