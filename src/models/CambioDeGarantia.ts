// Un monto negativo es lo que pasa a faltar de la garantía; uno positivo es el excedente, que se acredita.
export class CambioDeGarantia {
  private _nombre: string;
  private _monto: number;
  private _creditos: number;

  constructor(nombre: string, monto: number, creditos: number) {
    this._nombre = nombre;
    this._monto = monto;
    this._creditos = creditos;
  }

  nombre(): string {
    return this._nombre;
  }

  monto(): number {
    return this._monto;
  }

  loCubrenSusCreditos(): boolean {
    return this._monto < 0 && this._creditos >= -this._monto;
  }
}
