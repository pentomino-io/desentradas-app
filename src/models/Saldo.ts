// Lo que una persona le debe al grupo (negativo) o el grupo le debe a ella (positivo).
export class Saldo {
  private _nombre: string;
  private _monto: number;

  constructor(nombre: string, monto: number) {
    this._nombre = nombre;
    this._monto = monto;
  }

  nombre(): string {
    return this._nombre;
  }

  monto(): number {
    return this._monto;
  }
}
