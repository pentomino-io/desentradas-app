import type { Estado, NombreDeEstado } from "./estados/Estado.ts";

export type Disparador = "ingreso" | "voy" | "falto" | "cobro de garantía" | "cambio de reglas";

export class Transicion {
  private _fecha: Date;
  private _disparador: Disparador;
  private _hacia: Estado;

  constructor(fecha: Date, disparador: Disparador, hacia: Estado) {
    this._fecha = fecha;
    this._disparador = disparador;
    this._hacia = hacia;
  }

  fecha(): Date {
    return this._fecha;
  }

  disparador(): Disparador {
    return this._disparador;
  }

  hacia(): Estado {
    return this._hacia;
  }

  estado(): NombreDeEstado {
    return this._hacia.nombre();
  }
}
