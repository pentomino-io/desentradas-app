import { Credito } from "./Credito.ts";
import type { Movimiento } from "./Movimiento.ts";

export class Reparto implements Movimiento {
  private _fecha: Date;
  private _creditos: readonly Credito[];

  constructor(fecha: Date, creditos: readonly Credito[]) {
    if (creditos.length === 0) throw new Error("Un reparto necesita al menos un crédito");

    this._fecha = fecha;
    this._creditos = creditos;
  }

  fecha(): Date {
    return this._fecha;
  }

  acreedor(): string {
    return this._creditos[0].acreedor();
  }

  persona(): string {
    return this.acreedor();
  }

  describir(): string {
    return `la entrega a ${this.acreedor()}`;
  }

  creditos(): readonly Credito[] {
    return this._creditos;
  }

  monto(): number {
    return Credito.montoTotalDe(this._creditos);
  }

  efectoEnCaja(): number {
    return -this.monto();
  }
}
