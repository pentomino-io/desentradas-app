import { fechaYHora, monto } from "../app/Formato.ts";
import type { PlanillaDeAsistencia } from "../app/PlanillaDeAsistencia.ts";
import type { Participante } from "../models/Participante.ts";
import { Dialogo } from "./Dialogo.ts";
import { DialogoDeCobroDeGarantia } from "./DialogoDeCobroDeGarantia.ts";
import { DialogoDeRegistro } from "./DialogoDeRegistro.ts";
import { alerta, boton, botonDeEnvio, crear, fila, formulario, type Hijo, tablaOAviso } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { alfabetico, porNombre } from "./Orden.ts";

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
      () => this._pedirConfirmacion(),
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
    if (this._planillaDeAsistencia().asistentes().length === 0) {
      this._entorno.aplicacion().descartarPlanillaDeAsistencia();
      this._entorno.refrescar();
    } else {
      new Dialogo(
        this._entorno,
        "¿Descartar registro del encuentro?",
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
      ["Asiste", "Nombre", "Estado", ""],
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
      "aria-label": `Asiste ${nombre}`,
      checked: this._planillaDeAsistencia().asiste(nombre),
      disabled: !participante.puedeAsistir(),
      onchange: () => this._marcar(nombre, casilla.checked),
    });
    return fila(casilla, nombre, participante.estado(), this._accionDe(participante));
  }

  private _accionDe(participante: Participante): HTMLElement | false {
    const nombre = participante.nombre();
    if (!participante.puedeAsistir()) return boton("Cobrar garantía y habilitar", () => this._abrirCobro(nombre));
    if (!this._planillaDeAsistencia().asiste(nombre)) return false;

    const pendiente = this._entorno.grupo().caja().montoPendienteDe(nombre);
    return pendiente > 0 && boton(`Repartir ${monto(pendiente)}`, () => this._repartir(nombre));
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

  private _abrirCobro(nombre: string): void {
    new DialogoDeCobroDeGarantia(this._entorno, nombre, () =>
      this._entorno.aplicacion().cobrarGarantiaAAsistente(nombre, this._entorno.ahora()),
    ).abrir();
  }

  private _repartir(nombre: string): void {
    this._entorno.intentarYRefrescar(
      () => this._entorno.aplicacion().repartir(nombre, this._entorno.ahora()),
      this._errores,
    );
  }

  private _abrirIngreso(): void {
    new DialogoDeRegistro(this._entorno, "Vino alguien nuevo", (nombre) => this._ingresar(nombre)).abrir();
  }

  private _ingresar(nombre: string): void {
    this._entorno.aplicacion().ingresarAsistente(nombre, this._entorno.ahora());
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
