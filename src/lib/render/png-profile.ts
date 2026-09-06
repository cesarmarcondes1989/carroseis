import { crc32 } from "node:zlib";

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * O resvg gera PNG sem nenhum chunk de perfil de cor (sem sRGB, sem iCCP, sem gAMA).
 * A maioria dos visualizadores assume sRGB nesse caso, mas o app Fotos do iOS (e o Arquivos,
 * ao abrir uma imagem "solta") às vezes não assume e interpreta como um perfil mais amplo,
 * puxando o verde (a cor mais sensível a isso) pra um tom acinzentado/violeta. O Safari,
 * exibindo a mesma imagem dentro do app, não tem esse problema. Isso explica a cor batendo
 * certo no preview e saindo errada só depois de "Salvar no celular".
 *
 * Correção: marcar explicitamente a imagem como sRGB, inserindo o chunk padrão do PNG logo
 * após o IHDR (que por spec vem sempre primeiro), como aconselha a própria especificação do
 * formato. Não precisa de nenhuma lib de imagem: chunk é length(4) + tipo(4) + dados + crc32(4).
 */
export function withSrgbProfile(png: Buffer): Buffer {
  if (!png.subarray(0, 8).equals(SIGNATURE)) return png; // não é PNG, não mexe
  const ihdrLength = png.readUInt32BE(8);
  const ihdrEnd = 8 + 4 + 4 + ihdrLength + 4; // signature + length + "IHDR" + dados + crc
  if (png.readUInt32BE(12) !== 0x49484452 /* "IHDR" */ || png.length < ihdrEnd) return png;

  const type = Buffer.from("sRGB", "ascii");
  const data = Buffer.from([0]); // 0 = intenção perceptual
  const crcInput = Buffer.concat([type, data]);
  const chunk = Buffer.concat([
    Buffer.from([0, 0, 0, data.length]),
    type,
    data,
    (() => {
      const b = Buffer.alloc(4);
      b.writeUInt32BE(crc32(crcInput) >>> 0, 0);
      return b;
    })(),
  ]);

  return Buffer.concat([png.subarray(0, ihdrEnd), chunk, png.subarray(ihdrEnd)]);
}
