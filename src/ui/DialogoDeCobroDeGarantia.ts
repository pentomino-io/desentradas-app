import { monto } from "../app/Formato.ts";
import { Dialogo } from "./Dialogo.ts";
import { crear } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

export class DialogoDeCobroDeGarantia extends Dialogo {
  constructor(entorno: Entorno, nombre: string, cobrar: () => void) {
    const garantia = entorno.grupo().reglas().garantia();
    super(
      entorno,
      `Cobrar la garantía a ${nombre}`,
      [crear("p", {}, `Se le va a cobrar una garantía de ${monto(garantia)}.`)],
      "Cobrar",
      cobrar,
    );
  }
}
