import { Reglas } from "../models/Reglas.ts";
import { campoNumerico } from "./Campos.ts";
import { numeroDe } from "./dom.ts";

export const explicacionDeLaGarantia = "Se paga al ingresar; quien falta la pierde y se reparte entre quienes fueron.";

export const campoDeGarantia = (garantia = 1, ayuda?: string): HTMLElement =>
  campoNumerico("¿Cuánto se paga de garantía?", "garantia", garantia, 1, ayuda);

export const camposDeReglas = (reglas: Reglas): HTMLElement[] => [
  campoNumerico(
    "¿Hasta cuántas faltas seguidas sigue apareciendo alguien en la lista de asistencia?",
    "toleranciaDeFaltas",
    reglas.toleranciaDeFaltas(),
    1,
  ),
  campoDeGarantia(reglas.garantia()),
];

export const reglasDesde = (formulario: HTMLFormElement, rigeDesde: Date): Reglas =>
  new Reglas(rigeDesde, numeroDe(formulario, "toleranciaDeFaltas"), numeroDe(formulario, "garantia"));
