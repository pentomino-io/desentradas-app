import type { Encuentro } from "./Encuentro.ts";

export class GarantiaPerdida {
  private _persona: string;
  private _monto: number;
  private _encuentroFaltado: Encuentro;

  constructor(persona: string, monto: number, encuentroFaltado: Encuentro) {
    this._persona = persona;
    this._monto = monto;
    this._encuentroFaltado = encuentroFaltado;
  }

  persona(): string {
    return this._persona;
  }

  monto(): number {
    return this._monto;
  }

  encuentroFaltado(): Encuentro {
    return this._encuentroFaltado;
  }
}
