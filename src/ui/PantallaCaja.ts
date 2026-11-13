import { fechaYHora, monto, montoConSigno } from "../app/Formato.ts";
import type { Movimiento } from "../models/Movimiento.ts";
import type { Saldo } from "../models/Saldo.ts";
import { DialogoDePagoDeSaldoAFavor } from "./DialogoDePagoDeSaldoAFavor.ts";
import { DialogoDeCobroDeGarantia, tituloDelCobroDeLaGarantiaA } from "./DialogoDeCobroDeGarantia.ts";
import { boton, crear, desplegable, fila, type Hijo, tabla, tablaOAviso } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { porNombre } from "./Orden.ts";

export class PantallaCaja {
  private _entorno: Entorno;

  constructor(entorno: Entorno) {
    this._entorno = entorno;
  }

  elemento(): HTMLElement {
    const saldos = this._entorno.grupo().saldos().toSorted(porNombre);
    return crear(
      "section",
      {},
      crear("h2", {}, "Caja"),
      ...this._totales(),
      ...this._tablaDeSaldos(saldos),
      desplegable("Movimientos", this._tablaDeMovimientos()),
    );
  }

  private _totales(): Hijo[] {
    const porCompletar = this._entorno.grupo().totalPorCobrar();
    const porEntregar = this._entorno.grupo().caja().totalPendiente();
    return [
      crear("p", {}, `En caja ${monto(this._entorno.grupo().caja().totalEnCaja())}`),
      porCompletar > 0 && crear("p", { class: "falta" }, `Garantías por completar ${monto(porCompletar)}`),
      porEntregar > 0 && crear("p", { class: "credito" }, `Saldos a favor por pagar ${monto(porEntregar)}`),
    ];
  }

  private _tablaDeSaldos(saldos: readonly Saldo[]): Hijo[] {
    return tablaOAviso(
      "Saldos",
      ["Nombre", "Estado", "Saldo", ""],
      saldos.map((saldo) => this._filaDeSaldo(saldo)),
      "No hay nada para cobrar ni pagar",
    );
  }

  private _filaDeSaldo(saldo: Saldo): HTMLTableRowElement {
    return fila(
      saldo.nombre(),
      this._estadoDe(saldo),
      this._montosDe(saldo),
      crear(
        "span",
        {},
        saldo.debe() && boton("Cobrar garantía", () => this._abrirCobro(saldo.nombre())),
        saldo.debe() && saldo.tieneAFavor() && " ",
        saldo.tieneAFavor() && boton("Pagar saldo a favor", () => this._abrirEntrega(saldo)),
      ),
    );
  }

  private _montosDe(saldo: Saldo): HTMLSpanElement {
    return crear(
      "span",
      {},
      saldo.debe() && crear("span", { class: "falta" }, montoConSigno(-saldo.porCobrar())),
      saldo.debe() && saldo.tieneAFavor() && ", ",
      saldo.tieneAFavor() && crear("span", { class: "credito" }, montoConSigno(saldo.aFavor())),
    );
  }

  private _estadoDe(saldo: Saldo): string {
    const participante = this._entorno.grupo().participante(saldo.nombre())!;
    const situacion = this._entorno.grupo().situacionDe(participante);
    return saldo.loCubrenSusCreditos() ? `${situacion} (la cubre su saldo a favor)` : situacion;
  }

  private _tablaDeMovimientos(): HTMLElement | undefined {
    const movimientos = this._entorno.grupo().caja().movimientos().toReversed();
    return tabla(
      undefined,
      ["Fecha", "Nombre", "Monto"],
      movimientos.map((movimiento) => this._filaDeMovimiento(movimiento)),
    );
  }

  private _filaDeMovimiento(movimiento: Movimiento): HTMLTableRowElement {
    const efecto = movimiento.efectoEnCaja();
    const clase = efecto > 0 ? "entrada" : "salida";
    return fila(
      fechaYHora(movimiento.fecha()),
      movimiento.persona(),
      crear("span", { class: clase }, montoConSigno(efecto)),
    );
  }

  private _abrirCobro(nombre: string): void {
    const participante = this._entorno.grupo().participante(nombre)!;
    new DialogoDeCobroDeGarantia(
      this._entorno,
      participante,
      tituloDelCobroDeLaGarantiaA(nombre),
      "Puede volver a asistir.",
    ).abrir();
  }

  private _abrirEntrega(saldo: Saldo): void {
    new DialogoDePagoDeSaldoAFavor(this._entorno, saldo.nombre()).abrir();
  }
}
