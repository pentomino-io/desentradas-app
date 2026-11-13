import type { ComandoJson } from "../json/ComandoJson.ts";
import type { Grupo } from "../../models/Grupo.ts";
import { fecha, type Objeto, texto } from "../json/Campos.ts";
import { ComandoSobreUnaPersona } from "./ComandoSobreUnaPersona.ts";

export class IngresarSinPagar extends ComandoSobreUnaPersona {
  static desdeJson(campos: Objeto): IngresarSinPagar {
    return new IngresarSinPagar(texto(campos, "nombre"), fecha(campos, "fecha"));
  }

  protected ejecutarEn(grupo: Grupo): void {
    grupo.ingresarSinPagar(this._nombre, this._fecha);
  }

  describir(): string {
    return `Ingresó ${this._nombre}, sin pagar la garantía`;
  }

  aJson(): ComandoJson {
    return { tipo: "ingresar sin pagar", nombre: this._nombre, fecha: this._fecha.toISOString() };
  }
}
