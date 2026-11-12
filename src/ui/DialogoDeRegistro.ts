import { campoDeTexto } from "./Campos.ts";
import { Dialogo } from "./Dialogo.ts";
import type { Participante } from "../models/Participante.ts";
import { avisoDeGarantia, cobroDeLaGarantiaA } from "./DialogoDeCobroDeGarantia.ts";
import { crear, valorDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

const yaHayAlguien = (nombre: string): string => `Ya hay alguien con el nombre ${nombre}.`;

const pedidoDeOtroNombre = (nombre: string): string => `${yaHayAlguien(nombre)} Escribí otro nombre.`;

const pedidoDeIrALaLista = (nombre: string, accion: string): string =>
  `${nombre} ya está en la lista de asistencia: ${accion} ahí. Si es otra persona, escribí otro nombre.`;

export class DialogoDeRegistro {
  private _entorno: Entorno;
  private _titulo: string;
  private _ingresar: (nombre: string) => void;
  private _cobrarGarantia: (nombre: string) => void;
  private _conListaDeAsistencia: boolean;

  constructor(
    entorno: Entorno,
    titulo: string,
    ingresar: (nombre: string) => void,
    cobrarGarantia: (nombre: string) => void,
  ) {
    this._entorno = entorno;
    this._titulo = titulo;
    this._ingresar = ingresar;
    this._cobrarGarantia = cobrarGarantia;
    this._conListaDeAsistencia = false;
  }

  conListaDeAsistencia(): this {
    this._conListaDeAsistencia = true;
    return this;
  }

  abrir(pedido?: string): void {
    new Dialogo(
      this._entorno,
      this._titulo,
      [
        pedido !== undefined && crear("p", {}, pedido),
        campoDeTexto("Nombre", "nombre"),
        avisoDeGarantia(this._entorno.grupo()),
      ],
      "Registrar",
      (formulario) => this._registrar(valorDe(formulario, "nombre").trim()),
    ).abrir();
  }

  private _registrar(nombre: string): void {
    const participante = this._entorno.grupo().participante(nombre);
    if (participante === undefined) {
      this._ingresar(nombre);
      return;
    }

    const situacion = this._entorno.grupo().situacionDe(participante);
    if (situacion === "inactivo") {
      this._preguntarSiEsLaMismaPersona(participante);
    } else if (!this._conListaDeAsistencia) {
      throw new Error(pedidoDeOtroNombre(nombre));
    } else if (situacion === "participando") {
      throw new Error(pedidoDeIrALaLista(nombre, "marcala"));
    } else {
      throw new Error(pedidoDeIrALaLista(nombre, "completá su garantía"));
    }
  }

  private _preguntarSiEsLaMismaPersona(participante: Participante): void {
    const nombre = participante.nombre();
    const pregunta = `${yaHayAlguien(nombre)} ¿Es la misma persona?`;
    const cobro = `En ese caso, ${cobroDeLaGarantiaA(this._entorno.grupo(), participante)}`;
    new Dialogo(this._entorno, this._titulo, [crear("p", {}, `${pregunta} ${cobro}`)], "Sí", () =>
      this._cobrarGarantia(nombre),
    )
      .conTextoDeCancelacion("No, es otra persona", () => this.abrir(pedidoDeOtroNombre(nombre)))
      .abrir();
  }
}
