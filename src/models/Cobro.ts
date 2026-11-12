import type { Movimiento, TipoDeMovimiento } from "./Movimiento.ts";

type Motivo = "ingreso" | "garantía";

export class Cobro implements Movimiento {
  private _persona: string;
  private _monto: number;
  private _fecha: Date;
  private _motivo: Motivo;

  static alIngresar(persona: string, monto: number, fecha: Date): Cobro {
    return new Cobro(persona, monto, fecha, "ingreso");
  }

  static deGarantia(persona: string, monto: number, fecha: Date): Cobro {
    return new Cobro(persona, monto, fecha, "garantía");
  }

  private constructor(persona: string, monto: number, fecha: Date, motivo: Motivo) {
    if (monto <= 0) throw new Error("El monto del cobro debe ser positivo");

    this._persona = persona;
    this._monto = monto;
    this._fecha = fecha;
    this._motivo = motivo;
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

  describir(): string {
    return this._motivo === "ingreso" ? `ingreso de ${this._persona}` : `cobro de la garantía a ${this._persona}`;
  }
}
