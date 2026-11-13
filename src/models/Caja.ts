import type { Cobro } from "./Cobro.ts";
import { Credito } from "./Credito.ts";
import type { Desempate } from "./Desempate.ts";
import type { Desentrada } from "./Desentrada.ts";
import type { Movimiento } from "./Movimiento.ts";
import { Pago } from "./Pago.ts";

export class Caja {
  private _desempate: Desempate;
  private _cobros: Cobro[];
  private _creditosPendientes: Credito[];
  private _pagos: Pago[];

  constructor(desempate: Desempate) {
    this._desempate = desempate;
    this._cobros = [];
    this._creditosPendientes = [];
    this._pagos = [];
  }

  cobrar(cobro: Cobro): void {
    this._consumirCreditosDe(cobro.persona(), cobro.montoDeCreditos());
    this._cobros.push(cobro);
  }

  acreditar(credito: Credito): void {
    this._creditosPendientes.push(credito);
  }

  repartir(desentrada: Desentrada): void {
    this._creditosPendientes.push(...this._partesDe(desentrada));
  }

  pagar(nombre: string, fecha: Date): Pago {
    const creditos = this.creditosPendientesDe(nombre);
    if (creditos.length === 0) throw new Error(`${nombre} no tiene saldo a favor`);

    this._creditosPendientes = this._creditosPendientes.filter((credito) => credito.acreedor() !== nombre);
    const pago = new Pago(fecha, creditos);
    this._pagos.push(pago);
    return pago;
  }

  pagos(): readonly Pago[] {
    return this._pagos;
  }

  movimientos(): readonly Movimiento[] {
    return this._cobrosYPagos().filter((movimiento) => movimiento.monto() > 0);
  }

  // Incluye los cobros cubiertos con créditos, que no mueven plata pero también tienen fecha.
  movimientoPosteriorA(fecha: Date): Movimiento | undefined {
    return this._cobrosYPagos().findLast((movimiento) => movimiento.fecha() > fecha);
  }

  totalEnCaja(): number {
    return this.movimientos().reduce((total, movimiento) => total + movimiento.efectoEnCaja(), 0);
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

  private _cobrosYPagos(): readonly Movimiento[] {
    return [...this._cobros, ...this._pagos].sort((uno, otro) => uno.fecha().getTime() - otro.fecha().getTime());
  }

  private _consumirCreditosDe(nombre: string, monto: number): void {
    let porConsumir = monto;
    this._creditosPendientes = this._creditosPendientes.flatMap((credito) => {
      if (credito.acreedor() !== nombre) return [credito];

      const consumido = Math.min(porConsumir, credito.monto());
      porConsumir -= consumido;
      return consumido < credito.monto() ? [new Credito(nombre, credito.monto() - consumido)] : [];
    });
  }

  private _partesDe(desentrada: Desentrada): Credito[] {
    const asistentes = this._desempate.ordenar(desentrada.encuentroFaltado().asistentes(), desentrada);
    const parte = Math.floor(desentrada.monto() / asistentes.length);
    const sobrante = desentrada.monto() % asistentes.length;
    return asistentes
      .map((nombre, posicion) => new Credito(nombre, parte + (posicion < sobrante ? 1 : 0)))
      .filter((credito) => credito.monto() > 0);
  }
}
