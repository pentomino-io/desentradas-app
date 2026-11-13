import type { Movimiento } from "./Movimiento.ts";

export class Cobro implements Movimiento {
  private _persona: string;
  private _monto: number;
  private _fecha: Date;
  private _deSaldoAFavor: number;

  static deGarantia(persona: string, monto: number, fecha: Date, deSaldoAFavor: number): Cobro {
    return new Cobro(persona, monto, fecha, deSaldoAFavor);
  }

  private constructor(persona: string, monto: number, fecha: Date, deSaldoAFavor: number) {
    if (monto <= 0) throw new Error("El monto del cobro debe ser positivo");

    this._persona = persona;
    this._monto = monto;
    this._fecha = fecha;
    this._deSaldoAFavor = deSaldoAFavor;
  }

  persona(): string {
    return this._persona;
  }

  monto(): number {
    return this._monto - this._deSaldoAFavor;
  }

  efectoEnCaja(): number {
    return this.monto();
  }

  montoDeSaldoAFavor(): number {
    return this._deSaldoAFavor;
  }

  fecha(): Date {
    return this._fecha;
  }

  describir(): string {
    return `el cobro de la garantía a ${this._persona}`;
  }
}
