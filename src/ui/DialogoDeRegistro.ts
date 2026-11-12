import { campoDeTexto } from "./Campos.ts";
import { Dialogo } from "./Dialogo.ts";
import { avisoDeGarantia } from "./DialogoDeCobroDeGarantia.ts";
import { valorDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

export class DialogoDeRegistro extends Dialogo {
  constructor(entorno: Entorno, titulo: string, registrar: (nombre: string) => void) {
    super(entorno, titulo, [campoDeTexto("Nombre", "nombre"), avisoDeGarantia(entorno)], "Registrar", (formulario) => {
      registrar(valorDe(formulario, "nombre"));
    });
  }
}
