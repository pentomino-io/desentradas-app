import { campoDeTexto } from "./Campos.ts";
import { Dialogo } from "./Dialogo.ts";
import type { Participante } from "../models/Participante.ts";
import {
  cobroDeLaGarantiaA,
  DialogoDeCobroDeGarantia,
  registroDelCobroA,
  tituloDelCobroDeLaGarantiaA,
} from "./DialogoDeCobroDeGarantia.ts";
import { crear, valorDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

const yaHayAlguien = (nombre: string): string => `Ya hay alguien con el nombre ${nombre}.`;

const pedidoDeOtroNombre = (nombre: string): string => `${yaHayAlguien(nombre)} Escribí otro nombre.`;

export class DialogoDeRegistro {
  private _entorno: Entorno;
  private _titulo: string;
  private _consecuenciaDelCobro: string;
  private _cobrarGarantia: (nombre: string) => void;
  private _pedidoPorNombreUsado: (participante: Participante) => string;

  constructor(
    entorno: Entorno,
    titulo: string,
    consecuenciaDelCobro: string,
    cobrarGarantia: (nombre: string) => void,
  ) {
    this._entorno = entorno;
    this._titulo = titulo;
    this._consecuenciaDelCobro = consecuenciaDelCobro;
    this._cobrarGarantia = cobrarGarantia;
    this._pedidoPorNombreUsado = (participante) => pedidoDeOtroNombre(participante.nombre());
  }

  conPedidoPorNombreUsado(pedido: (participante: Participante) => string): this {
    this._pedidoPorNombreUsado = pedido;
    return this;
  }

  abrir(pedido?: string): void {
    new Dialogo(
      this._entorno,
      this._titulo,
      [pedido !== undefined && crear("p", {}, pedido), campoDeTexto("Nombre", "nombre")],
      "Registrar",
      (formulario) => this._registrar(valorDe(formulario, "nombre").trim()),
    ).abrir();
  }

  private _registrar(nombre: string): void {
    const participante = this._entorno.grupo().participante(nombre);
    if (participante === undefined) {
      this._entorno.aplicacion().ingresar(nombre, this._entorno.ahora());
      this._ofrecerElCobroA(this._entorno.grupo().participante(nombre)!);
    } else if (this._entorno.grupo().situacionDe(participante) === "inactivo") {
      this._preguntarSiEsLaMismaPersona(participante);
    } else {
      throw new Error(this._pedidoPorNombreUsado(participante));
    }
  }

  private _ofrecerElCobroA(participante: Participante): void {
    const nombre = participante.nombre();
    new DialogoDeCobroDeGarantia(
      this._entorno,
      participante,
      tituloDelCobroDeLaGarantiaA(nombre),
      this._consecuenciaDelCobro,
      () => this._cobrarGarantia(nombre),
    )
      .conTextoDeCancelacion("Cobrar después")
      .abrir();
  }

  private _preguntarSiEsLaMismaPersona(participante: Participante): void {
    const nombre = participante.nombre();
    const pregunta = `${yaHayAlguien(nombre)} ¿Es la misma persona?`;
    const cobro = `En ese caso, ${cobroDeLaGarantiaA(this._entorno.grupo(), participante)}`;
    new Dialogo(
      this._entorno,
      this._titulo,
      [crear("p", {}, `${pregunta} ${cobro}`)],
      registroDelCobroA(this._entorno.grupo(), participante),
      () => this._cobrarGarantia(nombre),
    )
      .conTextoDeCancelacion("No, es otra persona", () => this.abrir(pedidoDeOtroNombre(nombre)))
      .abrir();
  }
}
