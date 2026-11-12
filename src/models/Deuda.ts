import type { Encuentro } from "./Encuentro.ts";

export class Deuda {
  private _monto: number;
  private _encuentroFaltado: Encuentro;

  constructor(monto: number, encuentroFaltado: Encuentro) {
    this._monto = monto;
    this._encuentroFaltado = encuentroFaltado;
  }

  monto(): number {
    return this._monto;
  }

  encuentroFaltado(): Encuentro {
    return this._encuentroFaltado;
  }

  estaSaldada(): boolean {
    return this._monto === 0;
  }

  pagar(fecha: Date, monto: number): void {
    if (monto <= 0) throw new Error("El monto del pago debe ser positivo");
    this._asertarQueNoEsAnteriorAlEncuentroFaltado(fecha);
    if (monto > this._monto) throw new Error("El pago no puede superar la deuda");

    this._monto -= monto;
  }

  private _asertarQueNoEsAnteriorAlEncuentroFaltado(fecha: Date): void {
    if (fecha < this._encuentroFaltado.fecha()) throw new Error("El cobro no puede ser anterior al encuentro faltado");
  }
}
