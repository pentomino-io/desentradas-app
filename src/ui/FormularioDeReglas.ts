import { Reglas } from "../models/Reglas.ts";
import { campoNumerico } from "./Campos.ts";
import { numeroDe } from "./dom.ts";

export const explicacionDeLaDesentrada =
  "Se adelanta como garantía antes de asistir; quien falta la pierde y se reparte entre quienes fueron.";

export const campoDeDesentrada = (desentrada = 1, ayuda?: string): HTMLElement =>
  campoNumerico("¿De cuánto es la desentrada?", "desentrada", desentrada, 1, ayuda);

export const camposDeReglas = (reglas: Reglas): HTMLElement[] => [
  campoNumerico(
    "¿Hasta cuántas faltas seguidas sigue apareciendo alguien en la lista de asistencia?",
    "toleranciaDeFaltas",
    reglas.toleranciaDeFaltas(),
    1,
  ),
  campoDeDesentrada(reglas.desentrada()),
];

export const reglasDesde = (formulario: HTMLFormElement, rigeDesde: Date): Reglas =>
  new Reglas(rigeDesde, numeroDe(formulario, "toleranciaDeFaltas"), numeroDe(formulario, "desentrada"));
