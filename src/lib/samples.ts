import type { Slide, Template } from "@/lib/types";

const PT: Record<string, Slide> = {
  social: { titulo: "Ninguém está esperando o seu conteúdo perfeito. Posta.", texto: "O feed premia consistência, não perfeição.", etiqueta: "Opinião" },
  insider: { titulo: "Como eu fecho contrato sem ligar pra ninguém", texto: "Meu método, passo a passo.", etiqueta: "Bastidor" },
  identity: { titulo: "O erro que trava 9 em cada 10 negócios locais", texto: "E como destravar essa semana.", etiqueta: "Autoridade" },
  fulltext: { titulo: "Regra 1: quem não mede, não melhora", texto: "Simples assim.", etiqueta: "Thread" },
  news: { titulo: "Prefeitura anuncia **mudança** no IPTU de 2027", texto: "O que muda pro seu bolso.", etiqueta: "Urgente" },
};
const EN: Record<string, Slide> = {
  social: { titulo: "Nobody is waiting for your perfect post. Post.", texto: "The feed rewards consistency, not perfection.", etiqueta: "Opinion" },
  insider: { titulo: "How I close deals without a single call", texto: "My method, step by step.", etiqueta: "Behind the scenes" },
  identity: { titulo: "The mistake that stalls 9 in 10 local businesses", texto: "And how to fix it this week.", etiqueta: "Authority" },
  fulltext: { titulo: "Rule 1: what you don't measure, you don't improve", texto: "That simple.", etiqueta: "Thread" },
  news: { titulo: "City announces **change** to 2027 property tax", texto: "What it means for you.", etiqueta: "Breaking" },
};
const NICHE: Record<string, Slide> = {
  advocacia: { titulo: "Demitido sem justa causa? Você tem **7 direitos**", texto: "E a maioria não cobra nenhum.", etiqueta: "Direito do trabalho" },
  marketing: { titulo: "5 erros que fazem seu **anúncio** queimar dinheiro", texto: "E como consertar cada um hoje.", etiqueta: "Tráfego pago" },
  ia: { titulo: "3 ferramentas de **IA** que substituem um estagiário", texto: "E custam menos que um café.", etiqueta: "IA" },
  imobiliaria: { titulo: "Primeiro apê: o que ninguém te conta sobre **financiamento**", texto: "Antes de assinar qualquer coisa.", etiqueta: "Imóveis" },
  nutricionista: { titulo: "Café da manhã que **sabota** sua dieta", texto: "3 trocas simples.", etiqueta: "Nutrição" },
  medicos: { titulo: "Sinais de **pressão alta** que você ignora", texto: "Quando procurar ajuda.", etiqueta: "Prevenção" },
  educacao: { titulo: "Técnica de estudo que **dobra** a retenção", texto: "Funciona pra concurso e vestibular.", etiqueta: "Estudo" },
  "clinica-estetica": { titulo: "Harmonização facial: **mitos** e verdades", texto: "O que esperar do procedimento.", etiqueta: "Estética" },
  contabilidade: { titulo: "MEI: 4 erros que geram **multa** na Receita", texto: "Evite antes de abril.", etiqueta: "Imposto" },
  academia: { titulo: "Hipertrofia: o que **realmente** importa", texto: "Treino, sono e comida. Nessa ordem.", etiqueta: "Treino" },
  turismo: { titulo: "Roteiro de 5 dias na **Chapada** gastando pouco", texto: "Com valores atualizados.", etiqueta: "Roteiro" },
  beleza: { titulo: "Skincare: a ordem **certa** dos produtos", texto: "Manhã e noite.", etiqueta: "Pele" },
  categoria: { titulo: "Senado aprova **nova regra** para aposentadoria", texto: "Entenda o que muda a partir de 2027.", etiqueta: "Política" },
  dentistas: { titulo: "Clareamento: o que **funciona** de verdade", texto: "E o que só mancha o dente.", etiqueta: "Odonto" },
  joias: { titulo: "Como saber se a **semijoia** é boa", texto: "Antes de comprar.", etiqueta: "Luxo" },
  pets: { titulo: "5 alimentos que seu cachorro **nunca** pode comer", texto: "Alguns estão na sua mesa agora.", etiqueta: "Pets" },
};

/** Conteúdo de exemplo por template, pra preview na landing e no criador. */
export function sampleSlides(template: Template, locale: "pt-BR" | "en" = "pt-BR"): Slide[] {
  const byId = NICHE[template.id];
  if (byId) return [byId];
  const dict = locale === "en" ? EN : PT;
  return [dict[template.layout] ?? PT[template.layout] ?? { titulo: template.name }];
}
