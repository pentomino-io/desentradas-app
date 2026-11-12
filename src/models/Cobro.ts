import type { Movimiento, TipoDeMovimiento } from "./Movimiento.ts";

export class Cobro implements Movimiento {
  private _persona: string;
  private _monto: number;
  private _fecha: Date;

  constructor(persona: string, monto: number, fecha: Date) {
    if (monto <= 0) throw new Error("El monto del cobro debe ser positivo");

    this._persona = persona;
    this._monto = monto;
    this._fecha = fecha;
  }

  tipo(): TipoDeMovimiento {
    return "cobro";
  }

  persona(): string {
    return this._persona;
  }

  monto(): number {
    return this._monto;
  }

  fecha(): Date {
    return this._fecha;
  }
}
