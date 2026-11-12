// Un monto negativo es lo que falta de la garantía, que se cubre en lo posible con créditos;
// uno positivo es el excedente, que se acredita.
export class CambioDeGarantia {
  private _nombre: string;
  private _monto: number;
  private _deCreditos: number;

  constructor(nombre: string, monto: number, deCreditos: number) {
    this._nombre = nombre;
    this._monto = monto;
    this._deCreditos = deCreditos;
  }

  nombre(): string {
    return this._nombre;
  }

  monto(): number {
    return this._monto;
  }

  deCreditos(): number {
    return this._deCreditos;
  }

  porCobrar(): number {
    return Math.max(0, -this._monto - this._deCreditos);
  }
}
