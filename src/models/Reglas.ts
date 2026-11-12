export class Reglas {
  private _rigeDesde: Date;
  private _toleranciaDeFaltas: number;
  private _garantia: number;

  constructor(rigeDesde: Date, toleranciaDeFaltas: number, garantia: number) {
    if (toleranciaDeFaltas < 1) throw new Error("La tolerancia de faltas debe ser al menos 1");
    if (garantia <= 0) throw new Error("La garantía debe ser positiva");

    this._rigeDesde = rigeDesde;
    this._toleranciaDeFaltas = toleranciaDeFaltas;
    this._garantia = garantia;
  }

  rigeDesde(): Date {
    return this._rigeDesde;
  }

  toleranciaDeFaltas(): number {
    return this._toleranciaDeFaltas;
  }

  garantia(): number {
    return this._garantia;
  }

  superaLaTolerancia(faltas: number): boolean {
    return faltas > this._toleranciaDeFaltas;
  }
}
