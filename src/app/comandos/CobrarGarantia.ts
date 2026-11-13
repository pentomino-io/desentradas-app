import type { ComandoJson } from "../json/ComandoJson.ts";
import type { Grupo } from "../../models/Grupo.ts";
import { fecha, type Objeto, texto } from "../json/Campos.ts";
import { ComandoSobreUnaPersona } from "./ComandoSobreUnaPersona.ts";

export class CobrarGarantia extends ComandoSobreUnaPersona {
  static desdeJson(campos: Objeto): CobrarGarantia {
    return new CobrarGarantia(texto(campos, "nombre"), fecha(campos, "fecha"));
  }

  protected ejecutarEn(grupo: Grupo): void {
    grupo.cobrarGarantia(this._nombre, this._fecha);
  }

  describir(): string {
    return `Se cobró la desentrada a ${this._nombre}`;
  }

  aJson(): ComandoJson {
    return { tipo: "cobrar garantía", nombre: this._nombre, fecha: this._fecha.toISOString() };
  }
}
