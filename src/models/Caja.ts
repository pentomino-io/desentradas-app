import type { Cobro } from "./Cobro.ts";
import { Credito } from "./Credito.ts";
import type { Desempate } from "./Desempate.ts";
import type { GarantiaPerdida } from "./GarantiaPerdida.ts";
import type { Movimiento } from "./Movimiento.ts";
import { Reparto } from "./Reparto.ts";

export class Caja {
  private _desempate: Desempate;
  private _cobros: Cobro[];
  private _creditosPendientes: Credito[];
  private _repartos: Reparto[];

  constructor(desempate: Desempate) {
    this._desempate = desempate;
    this._cobros = [];
    this._creditosPendientes = [];
    this._repartos = [];
  }

  cobrar(cobro: Cobro): void {
    this._cobros.push(cobro);
  }

  acreditar(credito: Credito): void {
    this._creditosPendientes.push(credito);
  }

  distribuir(garantiaPerdida: GarantiaPerdida): void {
    this._creditosPendientes.push(...this._creditosPorDistribuir(garantiaPerdida));
  }

  repartir(nombre: string, fecha: Date): Reparto {
    const creditos = this.creditosPendientesDe(nombre);
    if (creditos.length === 0) throw new Error(`${nombre} no tiene créditos pendientes`);

    this._creditosPendientes = this._creditosPendientes.filter((credito) => credito.acreedor() !== nombre);
    const reparto = new Reparto(fecha, creditos);
    this._repartos.push(reparto);
    return reparto;
  }

  repartos(): readonly Reparto[] {
    return this._repartos;
  }

  movimientos(): readonly Movimiento[] {
    return [...this._cobros, ...this._repartos].sort((uno, otro) => uno.fecha().getTime() - otro.fecha().getTime());
  }

  movimientoPosteriorA(fecha: Date): Movimiento | undefined {
    return this.movimientos().findLast((movimiento) => movimiento.fecha() > fecha);
  }

  creditosPendientesDe(nombre: string): readonly Credito[] {
    return this._creditosPendientes.filter((credito) => credito.acreedor() === nombre);
  }

  montoPendienteDe(nombre: string): number {
    return Credito.montoTotalDe(this.creditosPendientesDe(nombre));
  }

  totalPendiente(): number {
    return Credito.montoTotalDe(this._creditosPendientes);
  }

  nombresConCreditosPendientes(): string[] {
    return [...new Set(this._creditosPendientes.map((credito) => credito.acreedor()))];
  }

  private _creditosPorDistribuir(garantiaPerdida: GarantiaPerdida): Credito[] {
    const asistentes = this._desempate.ordenar(garantiaPerdida.encuentroFaltado().asistentes(), garantiaPerdida);
    const parte = Math.floor(garantiaPerdida.monto() / asistentes.length);
    const sobrante = garantiaPerdida.monto() % asistentes.length;
    return asistentes
      .map((nombre, posicion) => new Credito(nombre, parte + (posicion < sobrante ? 1 : 0)))
      .filter((credito) => credito.monto() > 0);
  }
}
