import { monto } from "../app/Formato.ts";
import type { Grupo } from "../models/Grupo.ts";
import type { Participante } from "../models/Participante.ts";
import { Dialogo } from "./Dialogo.ts";
import { crear } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

const cobroDeGarantia = (garantia: number): string => `Se le va a cobrar una garantía de ${monto(garantia)}.`;

export const avisoDeGarantia = (grupo: Grupo): HTMLParagraphElement =>
  crear("p", {}, cobroDeGarantia(grupo.reglas().garantia()));

const avisoDeCobro = (grupo: Grupo, participante: Participante): string => {
  const porCobrar = grupo.garantiaPorCobrarA(participante);
  if (grupo.situacionDe(participante) === "inactivo") return cobroDeGarantia(porCobrar);

  return `Se le va a cobrar ${monto(porCobrar)} para completar la garantía de ${monto(grupo.reglas().garantia())}.`;
};

export class DialogoDeCobroDeGarantia extends Dialogo {
  constructor(entorno: Entorno, participante: Participante, cobrar: () => void) {
    super(
      entorno,
      `Cobrar la garantía a ${participante.nombre()}`,
      [crear("p", {}, avisoDeCobro(entorno.grupo(), participante))],
      "Cobrar",
      cobrar,
    );
  }
}
