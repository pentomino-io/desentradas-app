import { Deuda } from "./Deuda.ts";
import type { Encuentro } from "./Encuentro.ts";

export class Reglas {
  private _rigeDesde: Date;
  private _toleranciaDeFaltas: number;
  private _montoPorFalta: number;

  constructor(rigeDesde: Date, toleranciaDeFaltas: number, montoPorFalta: number) {
    if (toleranciaDeFaltas < 1) throw new Error("La tolerancia de faltas debe ser al menos 1");
    if (montoPorFalta <= 0) throw new Error("El monto por falta debe ser positivo");

    this._rigeDesde = rigeDesde;
    this._toleranciaDeFaltas = toleranciaDeFaltas;
    this._montoPorFalta = montoPorFalta;
  }

  rigeDesde(): Date {
    return this._rigeDesde;
  }

  toleranciaDeFaltas(): number {
    return this._toleranciaDeFaltas;
  }

  montoPorFalta(): number {
    return this._montoPorFalta;
  }

  superaLaTolerancia(faltas: number): boolean {
    return faltas > this._toleranciaDeFaltas;
  }

  deudaPorFaltarA(encuentro: Encuentro): Deuda {
    return new Deuda(this._montoPorFalta, encuentro);
  }
}
