import { Reglas } from "../models/Reglas.ts";
import { campoNumerico } from "./Campos.ts";
import { numeroDe } from "./dom.ts";

export const explicacionDeLaGarantia = "Se paga al ingresar; quien falta la pierde y se reparte entre quienes fueron.";

export const camposDeReglas = (reglas?: Reglas, ayudaDeLaGarantia?: string): HTMLElement[] => [
  campoNumerico(
    "¿Cuántas faltas seguidas se toleran antes de quedar afuera?",
    "toleranciaDeFaltas",
    reglas?.toleranciaDeFaltas() ?? 1,
    1,
  ),
  campoNumerico("¿Cuánto se paga de garantía?", "garantia", reglas?.garantia() ?? 1, 1, ayudaDeLaGarantia),
];

export const reglasDesde = (formulario: HTMLFormElement, rigeDesde: Date): Reglas =>
  new Reglas(rigeDesde, numeroDe(formulario, "toleranciaDeFaltas"), numeroDe(formulario, "garantia"));
