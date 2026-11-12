import { monto } from "../app/Formato.ts";
import type { Grupo } from "../models/Grupo.ts";
import type { Participante } from "../models/Participante.ts";
import { Dialogo } from "./Dialogo.ts";
import { crear } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

export const avisoDeGarantia = (grupo: Grupo): HTMLParagraphElement =>
  crear("p", {}, `Se le va a cobrar una garantía de ${monto(grupo.reglas().garantia())}.`);

export const laCubrenSusCreditos = (grupo: Grupo, participante: Participante): boolean =>
  grupo.creditosParaLaGarantiaDe(participante) === grupo.garantiaPorCobrarA(participante);

export const parteDeCreditos = (grupo: Grupo, participante: Participante): string => {
  const deCreditos = grupo.creditosParaLaGarantiaDe(participante);
  const enEfectivo = grupo.garantiaPorCobrarA(participante) - deCreditos;
  return deCreditos === 0 ? "" : ` (${monto(deCreditos)} de créditos, ${monto(enEfectivo)} en efectivo)`;
};

const avisoDeCobro = (grupo: Grupo, participante: Participante): string => {
  const porCobrar = grupo.garantiaPorCobrarA(participante);
  const cubierta = laCubrenSusCreditos(grupo, participante);
  if (grupo.situacionDe(participante) === "inactivo") {
    return cubierta
      ? `La garantía de ${monto(porCobrar)} la cubren sus créditos: no hay que cobrarle nada.`
      : `Se le va a cobrar una garantía de ${monto(porCobrar)}${parteDeCreditos(grupo, participante)}.`;
  }

  const garantia = monto(grupo.reglas().garantia());
  return cubierta
    ? `Le faltan ${monto(porCobrar)} para completar la garantía de ${garantia}. Sus créditos lo cubren: no hay que cobrarle nada.`
    : `Se le va a cobrar ${monto(porCobrar)} para completar la garantía de ${garantia}${parteDeCreditos(grupo, participante)}.`;
};

const textoDeConfirmacion = (grupo: Grupo, participante: Participante): string => {
  if (!laCubrenSusCreditos(grupo, participante)) return "Cobrar";

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
