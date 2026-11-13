import type { Movimiento } from "./Movimiento.ts";

type Motivo = "ingreso" | "garantía";

export class Cobro implements Movimiento {
  private _persona: string;
  private _monto: number;
  private _fecha: Date;
  private _motivo: Motivo;
  private _deSaldoAFavor: number;

  static alIngresar(persona: string, monto: number, fecha: Date): Cobro {
    return new Cobro(persona, monto, fecha, "ingreso");
  }

  static deGarantia(persona: string, monto: number, fecha: Date, deSaldoAFavor: number): Cobro {
    return new Cobro(persona, monto, fecha, "garantía", deSaldoAFavor);
  }

  private constructor(persona: string, monto: number, fecha: Date, motivo: Motivo, deSaldoAFavor = 0) {
    if (monto <= 0) throw new Error("El monto del cobro debe ser positivo");

    this._persona = persona;
    this._monto = monto;
    this._fecha = fecha;
    this._motivo = motivo;
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
    return this._motivo === "ingreso" ? `el ingreso de ${this._persona}` : `el cobro de la garantía a ${this._persona}`;
  }
}
