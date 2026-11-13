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

  situacion(garantiaVigente: number): Situacion {
    return this.saldoDeGarantia(garantiaVigente) < 0 ? "desentrada incompleta" : "participando";
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
    if (this._garantia >= garantia) throw new TransicionInvalida("cobrar la desentrada", "con la desentrada completa");

    return new Participando(garantia);
  }

  override garantia(): number {
    return this._garantia;
  }

  override saldoDeGarantia(garantiaVigente: number): number {
    return this._garantia - garantiaVigente;
  }
}
