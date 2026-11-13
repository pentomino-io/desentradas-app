import { fechaYHora, monto } from "../app/Formato.ts";
import type { Movimiento } from "../models/Movimiento.ts";
import type { Saldo } from "../models/Saldo.ts";
import { Dialogo } from "./Dialogo.ts";
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
      porCompletar > 0 && crear("p", { class: "falta" }, `Desentradas por completar ${monto(porCompletar)}`),
      porEntregar > 0 && crear("p", { class: "credito" }, `Créditos por entregar ${monto(porEntregar)}`),
    ];
  }

  private _tablaDeSaldos(saldos: readonly Saldo[]): Hijo[] {
    return tablaOAviso(
      "Saldos",
      ["Nombre", "Estado", "Saldo", ""],
      saldos.map((saldo) => this._filaDeSaldo(saldo)),
      "No hay nada para cobrar ni entregar",
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
        saldo.debe() && boton("Cobrar desentrada", () => this._abrirCobro(saldo.nombre())),
        saldo.debe() && saldo.tieneAFavor() && " ",
        saldo.tieneAFavor() && boton("Entregar crédito", () => this._abrirEntrega(saldo)),
      ),
    );
  }

  private _montosDe(saldo: Saldo): HTMLSpanElement {
    return crear(
      "span",
      {},
      saldo.debe() && crear("span", { class: "falta" }, `falta ${monto(saldo.porCobrar())}`),
      saldo.debe() && saldo.tieneAFavor() && ", ",
      saldo.tieneAFavor() && crear("span", { class: "credito" }, `crédito ${monto(saldo.aFavor())}`),
    );
  }

  private _estadoDe(saldo: Saldo): string {
    const participante = this._entorno.grupo().participante(saldo.nombre())!;
    const situacion = this._entorno.grupo().situacionDe(participante);
    return saldo.loCubrenSusCreditos() ? `${situacion} (la cubre su crédito)` : situacion;
  }

  private _tablaDeMovimientos(): HTMLElement | undefined {
    const movimientos = this._entorno.grupo().caja().movimientos().toReversed();
    return tabla(
      undefined,
      ["Fecha", "Nombre", "Tipo", "Monto"],
      movimientos.map((movimiento) => this._filaDeMovimiento(movimiento)),
    );
  }

  private _filaDeMovimiento(movimiento: Movimiento): HTMLTableRowElement {
    return fila(fechaYHora(movimiento.fecha()), movimiento.persona(), movimiento.tipo(), monto(movimiento.monto()));
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
    const nombre = saldo.nombre();
    new Dialogo(
      this._entorno,
      `Entregar crédito a ${nombre}`,
      [crear("p", {}, `Hay que entregarle ${monto(saldo.aFavor())}.`)],
      "Entregar",
      () => this._entorno.aplicacion().repartir(nombre, this._entorno.ahora()),
    ).abrir();
  }
}
