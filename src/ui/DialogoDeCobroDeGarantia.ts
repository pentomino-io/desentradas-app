import { monto } from "../app/Formato.ts";
import type { Grupo } from "../models/Grupo.ts";
import type { Participante } from "../models/Participante.ts";
import { Dialogo } from "./Dialogo.ts";
import { crear } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

export const avisoDeGarantia = (grupo: Grupo): HTMLParagraphElement =>
  crear("p", {}, `Hay que cobrarle ${monto(grupo.reglas().desentrada())} de garantía.`);

export const tituloDelCobroDeLaGarantiaA = (nombre: string): string => `Cobrar la garantía a ${nombre}`;

const efectivoParaLaGarantiaDe = (grupo: Grupo, participante: Participante): number =>
  grupo.garantiaPorCobrarA(participante) - grupo.saldoAFavorParaLaGarantiaDe(participante);

export const cobroDeLaGarantiaA = (grupo: Grupo, participante: Participante): string => {
  const porCobrar = grupo.garantiaPorCobrarA(participante);
  if (grupo.suSaldoAFavorCubreLaGarantiaDe(participante))
    return `la garantía de ${monto(porCobrar)} la cubre su saldo a favor: no hay que cobrarle nada.`;

  const deCreditos = grupo.saldoAFavorParaLaGarantiaDe(participante);
  if (deCreditos === 0) return `hay que cobrarle ${monto(porCobrar)} de garantía.`;

  const enEfectivo = monto(porCobrar - deCreditos);
  return `hay que cobrarle ${enEfectivo} en efectivo; los otros ${monto(deCreditos)} de la garantía de ${monto(porCobrar)} salen de su saldo a favor.`;
};

const conMayuscula = (texto: string): string => texto[0].toUpperCase() + texto.slice(1);

const avisoDeCompletarLaGarantia = (grupo: Grupo, participante: Participante): string => {
  const porCobrar = grupo.garantiaPorCobrarA(participante);
  const deCreditos = grupo.saldoAFavorParaLaGarantiaDe(participante);
  const completar = `completar la garantía de ${monto(grupo.reglas().desentrada())}`;
  if (deCreditos === 0) return `Hay que cobrarle ${monto(porCobrar)} para ${completar}.`;

  const faltante = `Le faltan ${monto(porCobrar)} para ${completar}.`;
  if (grupo.suSaldoAFavorCubreLaGarantiaDe(participante))
    return `${faltante} Lo cubre su saldo a favor: no hay que cobrarle nada.`;

  const enEfectivo = monto(porCobrar - deCreditos);
  return `${faltante} Hay que cobrarle ${enEfectivo} en efectivo; los otros ${monto(deCreditos)} salen de su saldo a favor.`;
};

const avisoDeCobro = (grupo: Grupo, participante: Participante): string =>
  grupo.situacionDe(participante) === "inactivo"
    ? conMayuscula(cobroDeLaGarantiaA(grupo, participante))
    : avisoDeCompletarLaGarantia(grupo, participante);

export const registroDelCobroA = (grupo: Grupo, participante: Participante): string => {
  if (grupo.suSaldoAFavorCubreLaGarantiaDe(participante)) return "Registrar cobro con saldo a favor";

  return `Registrar cobro de ${monto(efectivoParaLaGarantiaDe(grupo, participante))}`;
};

export class DialogoDeCobroDeGarantia extends Dialogo {
  constructor(
    entorno: Entorno,
    participante: Participante,
    titulo: string,
    consecuencia: string,
    cobrar = () => entorno.aplicacion().cobrarGarantia(participante.nombre(), entorno.ahora()),
  ) {
    super(
      entorno,
      titulo,
      [crear("p", {}, `${avisoDeCobro(entorno.grupo(), participante)} ${consecuencia}`)],
      registroDelCobroA(entorno.grupo(), participante),
      cobrar,
    );
  }
}
