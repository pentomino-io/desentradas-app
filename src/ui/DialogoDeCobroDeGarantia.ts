import { monto } from "../app/Formato.ts";
import type { Grupo } from "../models/Grupo.ts";
import type { Participante } from "../models/Participante.ts";
import { Dialogo } from "./Dialogo.ts";
import { crear } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

const cobroDeGarantia = (garantia: string): string => `Se le va a cobrar una garantía de ${garantia}.`;

export const avisoDeGarantia = (grupo: Grupo): HTMLParagraphElement =>
  crear("p", {}, cobroDeGarantia(monto(grupo.reglas().garantia())));

export const montoConCreditos = (grupo: Grupo, participante: Participante): string => {
  const porCobrar = grupo.garantiaPorCobrarA(participante);
  const deCreditos = grupo.creditosParaLaGarantiaDe(participante);
  if (deCreditos === 0) return monto(porCobrar);
  if (deCreditos === porCobrar) return `${monto(porCobrar)} (todo de créditos, nada en efectivo)`;

  return `${monto(porCobrar)} (${monto(deCreditos)} de créditos, ${monto(porCobrar - deCreditos)} en efectivo)`;
};

const avisoDeCobro = (grupo: Grupo, participante: Participante): HTMLParagraphElement => {
  const porCobrar = montoConCreditos(grupo, participante);
  if (grupo.situacionDe(participante) === "inactivo") return crear("p", {}, cobroDeGarantia(porCobrar));

  const garantia = monto(grupo.reglas().garantia());
  return crear("p", {}, `Se le va a cobrar ${porCobrar} para completar la garantía de ${garantia}.`);
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
