import { ConDeuda } from "./ConDeuda.ts";
import type { Estado, NombreDeEstado } from "./Estado.ts";
import { LibreDeDeuda } from "./LibreDeDeuda.ts";
import { Moroso } from "./Moroso.ts";

export class EnDeuda extends ConDeuda {
  nombre(): NombreDeEstado {
    return "en deuda";
  }

  override falto(): Estado {
    return new Moroso(this._deuda, this.reglas());
  }

  override soloLeFaltaPagarParaAsistir(): boolean {
    return true;
  }

  override deudaAl(_fecha: Date): number {
    return this._deuda.monto();
  }

  protected _pagar(fecha: Date, monto: number): void {
    this._deuda.pagar(fecha, monto);
  }

  protected _estadoAlSaldar(): Estado {
    return new LibreDeDeuda(this.faltas(), this.reglas());
  }
}
