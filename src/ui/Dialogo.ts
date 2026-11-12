import { alerta, boton, botonDeEnvio, crear, formulario, type Hijo } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

export class Dialogo {
  private _entorno: Entorno;
  private _titulo: string;
  private _campos: Hijo[];
  private _textoDeConfirmacion: string;
  private _textoDeCancelacion: string;
  private _alCancelar: () => void;
  private _alConfirmar: (formulario: HTMLFormElement) => void;
  private _errores: HTMLOutputElement;
  private _elemento: HTMLDialogElement | undefined;

  constructor(
    entorno: Entorno,
    titulo: string,
    campos: Hijo[],
    textoDeConfirmacion: string,
    alConfirmar: (formulario: HTMLFormElement) => void,
  ) {
    this._entorno = entorno;
    this._titulo = titulo;
    this._campos = campos;
    this._textoDeConfirmacion = textoDeConfirmacion;
    this._textoDeCancelacion = "Cancelar";
    this._alCancelar = () => {};
    this._alConfirmar = alConfirmar;
    this._errores = alerta();
    this._elemento = undefined;
  }

  conTextoDeCancelacion(texto: string, alCancelar = () => {}): this {
    this._textoDeCancelacion = texto;
    this._alCancelar = alCancelar;
    return this;
  }

  abrir(): void {
    this._elemento = this._entorno.mostrarDialogo(
      formulario(
        (completado) => this._confirmar(completado),
        crear("h3", {}, this._titulo),
        ...this._campos,
        this._errores,
        crear(
          "p",
          {},
          boton(this._textoDeCancelacion, () => this._cancelar()),
          " ",
          botonDeEnvio(this._textoDeConfirmacion),
        ),
      ),
    );
  }

  private _cancelar(): void {
    this._cerrar();
    this._alCancelar();
  }

  private _cerrar(): void {
    this._elemento?.close();
  }

  private _confirmar(formulario: HTMLFormElement): void {
    this._entorno.intentarYRefrescar(() => {
      this._alConfirmar(formulario);
      this._cerrar();
    }, this._errores);
  }
}

export const mostrarEnDialogo = (
  entorno: Entorno,
  titulo: string,
  textoDeCierre: string,
  ...contenido: Hijo[]
): void => {
  const dialogo = entorno.mostrarDialogo(
    crear("h3", {}, titulo),
    ...contenido,
    crear(
      "p",
      {},
      boton(textoDeCierre, () => dialogo.close()),
    ),
  );
};
