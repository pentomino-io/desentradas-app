import { ConDeuda } from "./ConDeuda.ts";
import type { Estado, NombreDeEstado } from "./Estado.ts";
import { Finalizado } from "./Finalizado.ts";

export class Moroso extends ConDeuda {
  nombre(): NombreDeEstado {
    return "moroso";
  }

  override soloLeFaltaPagarParaReingresar(): boolean {
    return true;
  }

  override deudaAl(_fecha: Date): number {
    return this._deuda.monto();
  }

  protected _pagar(fecha: Date, monto: number): void {
    this._deuda.pagar(fecha, monto);
  }

  protected _estadoAlSaldar(): Estado {
    return new Finalizado();
  }
}
