import { monto } from "../app/Formato.ts";
import { campoDeTexto, casilla } from "./Campos.ts";
import { Dialogo } from "./Dialogo.ts";
import type { Participante } from "../models/Participante.ts";
import { avisoDeGarantia, cobroDeLaGarantiaA } from "./DialogoDeCobroDeGarantia.ts";
import { crear, estaMarcado, valorDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

const yaHayAlguien = (nombre: string): string => `Ya hay alguien con el nombre ${nombre}.`;

const pedidoDeOtroNombre = (nombre: string): string => `${yaHayAlguien(nombre)} Escribí otro nombre.`;

export class DialogoDeRegistro {
  private _entorno: Entorno;
  private _titulo: string;
  private _ingresar: (nombre: string) => void;
  private _cobrarGarantia: (nombre: string) => void;
  private _pedidoPorNombreUsado: (participante: Participante) => string;
  private _ingresarSinPagar: ((nombre: string) => void) | undefined;

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
    this._pedidoPorNombreUsado = (participante) => pedidoDeOtroNombre(participante.nombre());
    this._ingresarSinPagar = undefined;
  }

  conIngresoSinPagar(ingresarSinPagar: (nombre: string) => void): this {
    this._ingresarSinPagar = ingresarSinPagar;
    return this;
  }

  conPedidoPorNombreUsado(pedido: (participante: Participante) => string): this {
    this._pedidoPorNombreUsado = pedido;
    return this;
  }

  abrir(pedido?: string, pago = false): void {
    new Dialogo(
      this._entorno,
      this._titulo,
      [
        pedido !== undefined && crear("p", {}, pedido),
        campoDeTexto("Nombre", "nombre"),
        this._ingresarSinPagar === undefined
          ? avisoDeGarantia(this._entorno.grupo())
          : casilla(`Pagó la garantía de ${monto(this._entorno.grupo().reglas().garantia())}`, "pago", pago),
      ],
      "Registrar",
      (formulario) => this._registrar(valorDe(formulario, "nombre").trim(), this._pago(formulario)),
    ).abrir();
  }

  private _pago(formulario: HTMLFormElement): boolean {
    return this._ingresarSinPagar === undefined || estaMarcado(formulario, "pago");
  }

  private _registrar(nombre: string, pago: boolean): void {
    const participante = this._entorno.grupo().participante(nombre);
    if (participante === undefined) {
      if (pago) this._ingresar(nombre);
      else this._ingresarSinPagar!(nombre);
    } else if (pago && this._entorno.grupo().situacionDe(participante) === "inactivo") {
      this._preguntarSiEsLaMismaPersona(participante);
    } else {
      throw new Error(this._pedidoPorNombreUsado(participante));
    }
  }

  private _preguntarSiEsLaMismaPersona(participante: Participante): void {
    const nombre = participante.nombre();
    const pregunta = `${yaHayAlguien(nombre)} ¿Es la misma persona?`;
    const cobro = `En ese caso, ${cobroDeLaGarantiaA(this._entorno.grupo(), participante)}`;
    new Dialogo(this._entorno, this._titulo, [crear("p", {}, `${pregunta} ${cobro}`)], "Sí", () =>
      this._cobrarGarantia(nombre),
    )
      .conTextoDeCancelacion("No, es otra persona", () => this.abrir(pedidoDeOtroNombre(nombre), true))
      .abrir();
  }
}
