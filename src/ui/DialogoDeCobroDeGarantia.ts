import { monto } from "../app/Formato.ts";
import { Dialogo } from "./Dialogo.ts";
import { crear } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

export const avisoDeGarantia = (entorno: Entorno): HTMLParagraphElement =>
  crear("p", {}, `Se le va a cobrar una garantía de ${monto(entorno.grupo().reglas().garantia())}.`);

export class DialogoDeCobroDeGarantia extends Dialogo {
  constructor(entorno: Entorno, nombre: string, cobrar: () => void) {
    super(entorno, `Cobrar la garantía a ${nombre}`, [avisoDeGarantia(entorno)], "Cobrar", cobrar);
  }
}
