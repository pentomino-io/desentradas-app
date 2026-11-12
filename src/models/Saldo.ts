// Lo que falta de la garantía no se compensa solo con los créditos: cada uno elige si acepta el cobro o se lleva el crédito.
export class Saldo {
  private _nombre: string;
  private _porCobrar: number;
  private _aFavor: number;

  constructor(nombre: string, porCobrar: number, aFavor: number) {
    this._nombre = nombre;
    this._porCobrar = porCobrar;
    this._aFavor = aFavor;
  }

  nombre(): string {
    return this._nombre;
  }

  porCobrar(): number {
    return this._porCobrar;
  }

  aFavor(): number {
    return this._aFavor;
  }

  debe(): boolean {
    return this._porCobrar > 0;
  }

  tieneAFavor(): boolean {
    return this._aFavor > 0;
  }

  loCubrenSusCreditos(): boolean {
    return this.debe() && this._aFavor >= this._porCobrar;
  }
}
