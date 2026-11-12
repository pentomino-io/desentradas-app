import { campoDeTexto } from "./Campos.ts";
import { Dialogo } from "./Dialogo.ts";
import type { Participante } from "../models/Participante.ts";
import { monto } from "../app/Formato.ts";
import { avisoDeGarantia, cobroDeLaGarantiaA } from "./DialogoDeCobroDeGarantia.ts";
import { crear, valorDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

const yaHayAlguien = (nombre: string): string => `Ya hay alguien con el nombre ${nombre}.`;

const pedidoDeOtroNombre = (nombre: string): string => `${yaHayAlguien(nombre)} Escribí otro nombre.`;

export class DialogoDeRegistro {
  private _entorno: Entorno;
  private _titulo: string;
  private _ingresar: (nombre: string) => void;
  private _cobrarGarantia: (nombre: string) => void;

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
    } else if (this._entorno.grupo().situacionDe(participante) === "inactivo") {
      this._preguntarSiEsLaMismaPersona(participante);
    } else {
      throw new Error(pedidoDeOtroNombre(nombre));
    }
  }

  private _cobroA(participante: Participante): string {
    const grupo = this._entorno.grupo();
    const garantia = grupo.garantiaPorCobrarA(participante);
    if (grupo.susCreditosCubrenLaGarantiaDe(participante)) {
      return `la garantía de ${monto(garantia)} la cubren sus créditos: no hay que cobrarle nada.`;
    }

    return `hay que ${cobroDeLaGarantiaA(grupo, participante)}`;
  }

  private _preguntarSiEsLaMismaPersona(participante: Participante): void {
    const nombre = participante.nombre();
    const pregunta = `${yaHayAlguien(nombre)} ¿Es la misma persona?`;
    const cobro = `En ese caso, ${this._cobroA(participante)}`;
    new Dialogo(this._entorno, this._titulo, [crear("p", {}, `${pregunta} ${cobro}`)], "Sí", () =>
      this._cobrarGarantia(nombre),
    )
      .conTextoDeCancelacion("No, es otra persona", () => this.abrir(pedidoDeOtroNombre(nombre)))
      .abrir();
  }
}
