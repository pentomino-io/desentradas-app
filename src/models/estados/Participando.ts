import { Estado, type NombreDeEstado } from "./Estado.ts";
import { Inactivo } from "./Inactivo.ts";

export class Participando extends Estado {
  private _garantia: number;

  constructor(garantia: number) {
    super();
    this._garantia = garantia;
  }

  nombre(): NombreDeEstado {
    return "participando";
  }

  override voy(): Estado {
    return this;
  }

  falto(): Estado {
    return new Inactivo(1);
  }

  override bajarGarantia(garantia: number): Estado {
    return new Participando(garantia);
  }

  override puedeAsistir(garantiaVigente: number): boolean {
    return this._garantia >= garantiaVigente;
  }

  override garantia(): number {
    return this._garantia;
  }
}
