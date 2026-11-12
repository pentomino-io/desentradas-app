import { monto } from "../app/Formato.ts";
import type { Grupo } from "../models/Grupo.ts";
import type { Participante } from "../models/Participante.ts";
import { Dialogo } from "./Dialogo.ts";
import { crear } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

export const avisoDeGarantia = (grupo: Grupo): HTMLParagraphElement =>
  crear("p", {}, `Hay que cobrarle ${monto(grupo.reglas().garantia())} de garantía.`);

export const cobroDeLaGarantiaA = (grupo: Grupo, participante: Participante): string => {
  const porCobrar = grupo.garantiaPorCobrarA(participante);
  const deCreditos = grupo.creditosParaLaGarantiaDe(participante);
  if (deCreditos === 0) return `cobrarle ${monto(porCobrar)} de garantía.`;

  const enEfectivo = monto(porCobrar - deCreditos);
  return `cobrarle ${enEfectivo} en efectivo; los otros ${monto(deCreditos)} de la garantía de ${monto(porCobrar)} salen de sus créditos.`;
};

const avisoDeCompletarLaGarantia = (grupo: Grupo, participante: Participante): string => {
  const porCobrar = grupo.garantiaPorCobrarA(participante);
  const deCreditos = grupo.creditosParaLaGarantiaDe(participante);
  const completar = `completar la garantía de ${monto(grupo.reglas().garantia())}`;
  if (deCreditos === 0) return `Hay que cobrarle ${monto(porCobrar)} para ${completar}.`;

  const faltante = `Le faltan ${monto(porCobrar)} para ${completar}.`;
  if (grupo.susCreditosCubrenLaGarantiaDe(participante))
    return `${faltante} Sus créditos lo cubren: no hay que cobrarle nada.`;

  const enEfectivo = monto(porCobrar - deCreditos);
  return `${faltante} Hay que cobrarle ${enEfectivo} en efectivo; los otros ${monto(deCreditos)} salen de sus créditos.`;
};

const avisoDeCobro = (grupo: Grupo, participante: Participante): string => {
  if (grupo.situacionDe(participante) !== "inactivo") return avisoDeCompletarLaGarantia(grupo, participante);

  return grupo.susCreditosCubrenLaGarantiaDe(participante)
    ? `La garantía de ${monto(grupo.garantiaPorCobrarA(participante))} la cubren sus créditos: no hay que cobrarle nada.`
    : `Hay que ${cobroDeLaGarantiaA(grupo, participante)}`;
};

const textoDeConfirmacion = (grupo: Grupo, participante: Participante): string => {
  if (!grupo.susCreditosCubrenLaGarantiaDe(participante)) return "Cobrar";

  return grupo.situacionDe(participante) === "inactivo" ? "Cubrir con créditos" : "Completar con créditos";
};

export class DialogoDeCobroDeGarantia extends Dialogo {
  constructor(
    entorno: Entorno,
    participante: Participante,
    cobrar = () => entorno.aplicacion().cobrarGarantia(participante.nombre(), entorno.ahora()),
  ) {
    super(
      entorno,
      `Cobrar la garantía a ${participante.nombre()}`,
      [crear("p", {}, avisoDeCobro(entorno.grupo(), participante))],
      textoDeConfirmacion(entorno.grupo(), participante),
      cobrar,
    );
  }
}
