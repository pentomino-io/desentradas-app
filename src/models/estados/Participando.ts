import { Estado, type NombreDeEstado, type Situacion } from "./Estado.ts";
import { Inactivo } from "./Inactivo.ts";
import { TransicionInvalida } from "./TransicionInvalida.ts";

export class Participando extends Estado {
  private _garantia: number;

  constructor(garantia: number) {
    super();
    this._garantia = garantia;
  }

  nombre(): NombreDeEstado {
    return "participando";
  }

  situacion(desentradaVigente: number): Situacion {
    return this.saldoDeGarantia(desentradaVigente) < 0 ? "garantía incompleta" : "participando";
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

  override cobrarGarantia(garantia: number): Estado {
    if (this._garantia >= garantia) throw new TransicionInvalida("cobrar la garantía", "con la garantía completa");

    return new Participando(garantia);
  }

  override garantia(): number {
    return this._garantia;
  }

  override saldoDeGarantia(desentradaVigente: number): number {
    return this._garantia - desentradaVigente;
  }
}
