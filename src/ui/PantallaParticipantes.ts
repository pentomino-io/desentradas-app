import type { Grupo } from "../models/Grupo.ts";
import type { Participante } from "../models/Participante.ts";
import { DialogoDeCobroDeGarantia, tituloDelCobroDeLaGarantiaA } from "./DialogoDeCobroDeGarantia.ts";
import { DialogoDeRegistro } from "./DialogoDeRegistro.ts";
import { boton, crear, desplegable, fila, type Hijo, tabla, tablaOAviso } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { porNombre } from "./Orden.ts";
import { estadoDe } from "./TextoDeEstado.ts";

const ultimoCambioDe = (participante: Participante) => participante.fechaDelUltimoCambio().getTime();

const porAtencionYNombre =
  (grupo: Grupo) =>
  (uno: Participante, otro: Participante): number => {
    const unoParticipa = grupo.puedeAsistir(uno);
    const otroParticipa = grupo.puedeAsistir(otro);
    if (unoParticipa !== otroParticipa) return unoParticipa ? 1 : -1;
    if (!unoParticipa && ultimoCambioDe(uno) !== ultimoCambioDe(otro)) {
      return ultimoCambioDe(otro) - ultimoCambioDe(uno);
    }

    return porNombre(uno, otro);
  };

export class PantallaParticipantes {
  private _entorno: Entorno;

  constructor(entorno: Entorno) {
    this._entorno = entorno;
  }

  elemento(): HTMLElement {
    return crear(
      "section",
      {},
      crear("h2", {}, "Participantes"),
      ...this._tablaDeActivos(),
      desplegable("Quienes ya no participan", this._tablaDeQuienesYaNoParticipan()),
    );
  }

  private _tablaDeActivos(): Hijo[] {
    const grupo = this._entorno.grupo();
    const activos = grupo.posiblesAsistentes().toSorted(porAtencionYNombre(grupo));
    return tablaOAviso(
      "Quienes participan",
      ["Nombre", "Estado", ""],
      activos.map((participante) => this._filaDeActivo(participante)),
      "Todavía no hay nadie",
      boton("Registrar participante", () => this._abrirIngreso()),
    );
  }

  private _filaDeActivo(participante: Participante): HTMLTableRowElement {
    return fila(
      participante.nombre(),
      estadoDe(this._entorno.grupo(), participante),
      participante.recienIngresado() && boton("Cobrar garantía", () => this._abrirCobro(participante)),
    );
  }

  private _tablaDeQuienesYaNoParticipan(): HTMLElement | undefined {
    return tabla(
      undefined,
      ["Nombre", ""],
      this._entorno
        .grupo()
        .quienesYaNoParticipan()
        .toSorted(porNombre)
        .map((participante) => this._filaDeQuienYaNoParticipa(participante)),
    );
  }

  private _filaDeQuienYaNoParticipa(participante: Participante): HTMLTableRowElement {
    return fila(
      participante.nombre(),
      boton("Reingresar", () => this._abrirReingreso(participante)),
    );
  }

  private _abrirIngreso(): void {
    new DialogoDeRegistro(
      this._entorno,
      "Registrar participante",
      (nombre) => {
        this._entorno.aplicacion().ingresar(nombre, this._entorno.ahora());
        this._entorno.aplicacion().cobrarGarantia(nombre, this._entorno.ahora());
      },
      (nombre) => this._entorno.aplicacion().cobrarGarantia(nombre, this._entorno.ahora()),
    )
      .conIngresoSinPagar((nombre) => this._entorno.aplicacion().ingresar(nombre, this._entorno.ahora()))
      .abrir();
  }

  private _abrirCobro(participante: Participante): void {
    new DialogoDeCobroDeGarantia(
      this._entorno,
      participante,
      tituloDelCobroDeLaGarantiaA(participante.nombre()),
      "Puede empezar a asistir.",
    ).abrir();
  }

  private _abrirReingreso(participante: Participante): void {
    new DialogoDeCobroDeGarantia(
      this._entorno,
      participante,
      `Reingresar a ${participante.nombre()}`,
      "Vuelve a la lista de asistencia.",
    ).abrir();
  }
}
