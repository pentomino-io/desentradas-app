import { fechaYHora, monto } from "../app/Formato.ts";
import type { Movimiento } from "../models/Movimiento.ts";
import type { Saldo } from "../models/Saldo.ts";
import { Dialogo } from "./Dialogo.ts";
import { DialogoDeCobroDeGarantia } from "./DialogoDeCobroDeGarantia.ts";
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
      saldos.length > 0 && this._totales(),
      ...this._tablaDeSaldos(saldos),
      desplegable("Movimientos", this._tablaDeMovimientos()),
    );
  }

  private _totales(): HTMLParagraphElement {
    const porCobrar = this._entorno.grupo().totalPorCobrar();
    const porRepartir = this._entorno.grupo().caja().totalPendiente();
    return crear(
      "p",
      {},
      porCobrar > 0 && crear("span", { class: "debe" }, `Por cobrar ${monto(porCobrar)}`),
      porCobrar > 0 && porRepartir > 0 && " ",
      porRepartir > 0 && crear("span", { class: "a-favor" }, `Por repartir ${monto(porRepartir)}`),
    );
  }

  private _tablaDeSaldos(saldos: readonly Saldo[]): Hijo[] {
    return tablaOAviso(
      "Saldos",
      ["Nombre", "Estado", "Saldo", ""],
      saldos.map((saldo) => this._filaDeSaldo(saldo)),
      "No hay nada para cobrar ni repartir",
    );
  }

  private _filaDeSaldo(saldo: Saldo): HTMLTableRowElement {
    const ambos = saldo.debe() && saldo.tieneAFavor();
    return fila(
      saldo.nombre(),
      this._estadoDe(saldo),
      crear(
        "span",
        {},
        saldo.debe() && crear("span", { class: "debe" }, monto(-saldo.porCobrar())),
        ambos && " ",
        saldo.tieneAFavor() && crear("span", { class: "a-favor" }, monto(saldo.aFavor())),
      ),
      crear(
        "span",
        {},
        saldo.debe() && boton("Cobrar garantía", () => this._abrirCobro(saldo.nombre())),
        ambos && " ",
        saldo.tieneAFavor() && boton("Registrar reparto", () => this._abrirReparto(saldo)),
      ),
    );
  }

  private _estadoDe(saldo: Saldo): string {
    const participante = this._entorno.grupo().participante(saldo.nombre())!;
    const situacion = this._entorno.grupo().situacionDe(participante);
    return saldo.loCubrenSusCreditos() ? `${situacion} (la cubren sus créditos)` : situacion;
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
    new DialogoDeCobroDeGarantia(this._entorno, this._entorno.grupo().participante(nombre)!).abrir();
  }

  private _abrirReparto(saldo: Saldo): void {
    const nombre = saldo.nombre();
    new Dialogo(
      this._entorno,
      `Reparto a ${nombre}`,
      [crear("p", {}, `Se le van a entregar ${monto(saldo.aFavor())}.`)],
      "Registrar reparto",
      () => this._entorno.aplicacion().repartir(nombre, this._entorno.ahora()),
    ).abrir();
  }
}
