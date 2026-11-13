export class Reglas {
  private _rigeDesde: Date;
  private _toleranciaDeFaltas: number;
  private _desentrada: number;

  constructor(rigeDesde: Date, toleranciaDeFaltas: number, desentrada: number) {
    if (toleranciaDeFaltas < 1) throw new Error("La tolerancia de faltas debe ser al menos 1");
    if (desentrada <= 0) throw new Error("La desentrada debe ser positiva");

    this._rigeDesde = rigeDesde;
    this._toleranciaDeFaltas = toleranciaDeFaltas;
    this._desentrada = desentrada;
  }

  rigeDesde(): Date {
    return this._rigeDesde;
  }

  toleranciaDeFaltas(): number {
    return this._toleranciaDeFaltas;
  }

  desentrada(): number {
    return this._desentrada;
  }

  superaLaTolerancia(faltas: number): boolean {
    return faltas > this._toleranciaDeFaltas;
  }
}
