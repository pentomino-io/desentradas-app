// Un monto negativo es lo que pasa a faltar de la garantía; uno positivo es el excedente, que se acredita.
export class CambioDeGarantia {
  private _nombre: string;
  private _monto: number;
  private _saldoAFavor: number;

  constructor(nombre: string, monto: number, saldoAFavor: number) {
    this._nombre = nombre;
    this._monto = monto;
    this._saldoAFavor = saldoAFavor;
  }

  nombre(): string {
    return this._nombre;
  }

  monto(): number {
    return this._monto;
  }

  loCubreSuSaldoAFavor(): boolean {
    return this._monto < 0 && this._saldoAFavor >= -this._monto;
  }
}
