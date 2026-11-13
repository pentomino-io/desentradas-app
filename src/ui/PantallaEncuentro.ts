import { fechaYHora, monto } from "../app/Formato.ts";
import type { PlanillaDeAsistencia } from "../app/PlanillaDeAsistencia.ts";
import type { Participante } from "../models/Participante.ts";
import { Dialogo, mostrarEnDialogo } from "./Dialogo.ts";
import { DialogoDeCobroDeGarantia, tituloDelCobroDeLaGarantiaA } from "./DialogoDeCobroDeGarantia.ts";
import { DialogoDePagoDeSaldoAFavor } from "./DialogoDePagoDeSaldoAFavor.ts";
import { DialogoDeRegistro } from "./DialogoDeRegistro.ts";
import { alerta, boton, botonDeEnvio, crear, fila, formulario, type Hijo, tablaOAviso } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { alfabetico, porNombre } from "./Orden.ts";
import { estadoDe } from "./TextoDeEstado.ts";

export class PantallaEncuentro {
  private _entorno: Entorno;
  private _errores: HTMLOutputElement;

  constructor(entorno: Entorno) {
    this._entorno = entorno;
    this._errores = alerta();
  }

  elemento(): HTMLElement {
    return crear(
      "section",
      {},
      crear("h2", {}, "Encuentro"),
      this._entorno.aplicacion().tienePlanillaDeAsistencia()
        ? this._formulario()
        : crear(
            "p",
            {},
            boton("Empezar encuentro", () => this._empezar()),
          ),
    );
  }

  private _formulario(): HTMLFormElement {
    return formulario(
      () => this._registrar(),
      ...this._tablaDeAsistencia(),
      this._errores,
      crear(
        "p",
        {},
        boton("Descartar", () => this._descartar()),
        " ",
        botonDeEnvio("Registrar encuentro"),
      ),
    );
  }

  private _empezar(): void {
    this._entorno.aplicacion().empezarPlanillaDeAsistencia();
    this._entorno.refrescar();
  }

  private _descartar(): void {
    if (!this._hayAsistentes()) {
      this._entorno.aplicacion().descartarPlanillaDeAsistencia();
      this._entorno.refrescar();
    } else {
      new Dialogo(
        this._entorno,
        "¿Descartar el encuentro empezado?",
        [crear("p", {}, "Se van a perder las marcas de asistencia.")],
        "Sí, descartar",
        () => this._entorno.aplicacion().descartarPlanillaDeAsistencia(),
      )
        .conTextoDeCancelacion("No, volver")
        .abrir();
    }
  }

  private _tablaDeAsistencia(): Hijo[] {
    const posiblesAsistentes = this._entorno.grupo().posiblesAsistentes().toSorted(porNombre);
    return tablaOAviso(
      "Asistencia",
      ["Presente", "Nombre", "Estado", ""],
      posiblesAsistentes.map((participante) => this._filaDe(participante)),
      "Todavía no hay nadie",
      boton("Vino alguien nuevo", () => this._abrirIngreso()),
    );
  }

  private _filaDe(participante: Participante): HTMLTableRowElement {
    const nombre = participante.nombre();
    const casilla = crear("input", {
      type: "checkbox",
      name: "asistentes",
      value: nombre,
      "aria-label": `Presente ${nombre}`,
      checked: this._planillaDeAsistencia().asiste(nombre),
      disabled: !this._entorno.grupo().puedeAsistir(participante),
      onchange: () => this._marcar(nombre, casilla.checked),
    });
    return fila(casilla, nombre, estadoDe(this._entorno.grupo(), participante), this._accionDe(participante));
  }

  private _accionDe(participante: Participante): HTMLElement | false {
    const nombre = participante.nombre();
    if (!this._entorno.grupo().puedeAsistir(participante))
      return boton("Cobrar garantía y habilitar", () => this._abrirCobro(participante));
    if (!this._planillaDeAsistencia().asiste(nombre)) return false;

    const saldoAFavor = this._entorno.grupo().caja().saldoAFavorDe(nombre);
    return saldoAFavor > 0 && boton(`Pagar ${monto(saldoAFavor)}`, () => this._pagar(nombre));
  }

  private _hayAsistentes(): boolean {
    return this._planillaDeAsistencia().asistentes().length > 0;
  }

  private _planillaDeAsistencia(): PlanillaDeAsistencia {
    return this._entorno.aplicacion().planillaDeAsistencia();
  }

  private _marcar(nombre: string, asiste: boolean): void {
    if (asiste) {
      this._planillaDeAsistencia().marcarComoPresente(nombre);
    } else {
      this._planillaDeAsistencia().desmarcarComoPresente(nombre);
    }
    this._entorno.refrescar();
  }

  private _abrirCobro(participante: Participante): void {
    const nombre = participante.nombre();
    new DialogoDeCobroDeGarantia(
      this._entorno,
      participante,
      tituloDelCobroDeLaGarantiaA(nombre),
      "Queda presente en este encuentro.",
      () => this._cobrarGarantia(nombre),
    ).abrir();
  }

  private _cobrarGarantia(nombre: string): void {
    this._entorno.aplicacion().cobrarGarantiaAAsistente(nombre, this._entorno.ahora());
  }

  private _pagar(nombre: string): void {
    new DialogoDePagoDeSaldoAFavor(this._entorno, nombre).abrir();
  }

  private _abrirIngreso(): void {
    new DialogoDeRegistro(this._entorno, "Vino alguien nuevo", "Queda presente en este encuentro.", (nombre) =>
      this._cobrarGarantia(nombre),
    )
      .conPedidoPorNombreUsado((participante) => this._pedidoDeIrALaListaPor(participante))
      .abrir();
  }

  private _pedidoDeIrALaListaPor(participante: Participante): string {
    const participando = this._entorno.grupo().situacionDe(participante) === "participando";
    const accion = participando ? "marcala" : "completá su garantía";
    return `${participante.nombre()} ya está en la lista de asistencia: ${accion} ahí. Si es otra persona, escribí otro nombre.`;
  }

  private _registrar(): void {
    if (!this._hayAsistentes()) {
      mostrarEnDialogo(
        this._entorno,
        "Registrar encuentro",
        "Volver",
        crear("p", {}, "No se puede registrar el encuentro sin asistentes."),
      );
    } else {
      this._pedirConfirmacion();
    }
  }

  private _pedirConfirmacion(): void {
    const ausentes = this._entorno.aplicacion().ausentesEnPlanillaDeAsistencia().toSorted(alfabetico);
    const aviso = ausentes.length === 0 ? "Nadie queda ausente." : `Quedan ausentes: ${ausentes.join(", ")}.`;
    new Dialogo(
      this._entorno,
      "Registrar encuentro",
      [
        crear("p", {}, `Se va a registrar el encuentro con fecha ${fechaYHora(this._entorno.ahora())}.`),
        crear("p", {}, aviso),
      ],
      "Confirmar",
      () => {
        this._entorno.aplicacion().registrarEncuentroSegunPlanillaDeAsistencia(this._entorno.ahora());
        this._entorno.irAlHistorial();
      },
    ).abrir();
  }
}
