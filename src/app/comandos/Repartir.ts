import type { ComandoJson } from "../json/ComandoJson.ts";
import type { Grupo } from "../../models/Grupo.ts";
import { fecha, type Objeto, texto } from "../json/Campos.ts";
import { ComandoSobreUnaPersona } from "./ComandoSobreUnaPersona.ts";

export class Repartir extends ComandoSobreUnaPersona {
  static desdeJson(campos: Objeto): Repartir {
    return new Repartir(texto(campos, "nombre"), fecha(campos, "fecha"));
  }

  protected ejecutarEn(grupo: Grupo): void {
    grupo.repartir(this._nombre, this._fecha);
  }

  describir(): string {
    return `Se le pagó su saldo a favor a ${this._nombre}`;
  }

  aJson(): ComandoJson {
    return { tipo: "repartir", nombre: this._nombre, fecha: this._fecha.toISOString() };
  }
}
