import { campoDeTexto } from "./Campos.ts";
import { Dialogo } from "./Dialogo.ts";
import { avisoDeGarantia, montoDeLaGarantia } from "./DialogoDeCobroDeGarantia.ts";
import { crear, valorDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

const pedidoDeOtroNombre = (nombre: string): string => `Ya hay alguien con el nombre ${nombre}. Escribí otro nombre.`;

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
        avisoDeGarantia(this._entorno),
      ],
      "Registrar",
      (formulario) => this._registrar(valorDe(formulario, "nombre").trim()),
    ).abrir();
  }

  private _registrar(nombre: string): void {
    const participante = this._entorno.grupo().participante(nombre);
    if (participante === undefined) {
      this._ingresar(nombre);
    } else if (participante.puedeAsistir()) {
      throw new Error(pedidoDeOtroNombre(nombre));
    } else {
      this._preguntarSiEsLaMismaPersona(nombre);
    }
  }

  private _preguntarSiEsLaMismaPersona(nombre: string): void {
    const pregunta = `Ya hay alguien con el nombre ${nombre}. ¿Es la misma persona?`;
    const cobro = `Si es ella, se le cobra la garantía de ${montoDeLaGarantia(this._entorno)}.`;
    new Dialogo(this._entorno, this._titulo, [crear("p", {}, `${pregunta} ${cobro}`)], "Sí", () =>
      this._cobrarGarantia(nombre),
    )
      .conTextoDeCancelacion("No, es otra persona", () => this.abrir(pedidoDeOtroNombre(nombre)))
      .abrir();
  }
}
