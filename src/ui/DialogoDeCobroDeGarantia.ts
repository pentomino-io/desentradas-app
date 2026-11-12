import { monto } from "../app/Formato.ts";
import type { Grupo } from "../models/Grupo.ts";
import type { Participante } from "../models/Participante.ts";
import { Dialogo } from "./Dialogo.ts";
import { crear } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

const cobroDeGarantia = (garantia: number): string => `Se le va a cobrar una garantía de ${monto(garantia)}.`;

export const avisoDeGarantia = (grupo: Grupo): HTMLParagraphElement =>
  crear("p", {}, cobroDeGarantia(grupo.reglas().garantia()));

const avisoDeCobro = (grupo: Grupo, participante: Participante): HTMLParagraphElement => {
  const porCobrar = grupo.garantiaPorCobrarA(participante);
  if (grupo.situacionDe(participante) === "inactivo") return crear("p", {}, cobroDeGarantia(porCobrar));

  const garantia = monto(grupo.reglas().garantia());
  return crear("p", {}, `Se le va a cobrar ${monto(porCobrar)} para completar la garantía de ${garantia}.`);
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
      [avisoDeCobro(entorno.grupo(), participante)],
      "Cobrar",
      cobrar,
    );
  }
}
