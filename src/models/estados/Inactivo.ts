import { Estado, type NombreDeEstado } from "./Estado.ts";
import { Participando } from "./Participando.ts";

export class Inactivo extends Estado {
  private _faltas: number;

  constructor(faltas: number) {
    super();
    this._faltas = faltas;
  }

  nombre(): NombreDeEstado {
    return "inactivo";
  }

  falto(): Estado {
    return new Inactivo(this._faltas + 1);
  }

  override cobrarGarantia(garantia: number): Estado {
    return new Participando(garantia);
  }

  override faltas(): number {
    return this._faltas;
  }
}
