import { campoDeTexto } from "./Campos.ts";
import { Reglas } from "../models/Reglas.ts";
import { alerta, botonDeEnvio, crear, formulario, numeroDe, valorDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { explicacionDeLaCargaFallida } from "./ExplicacionDeErrores.ts";
import { Importacion } from "./Importacion.ts";
import { campoDeDesentrada, explicacionDeLaDesentrada } from "./FormularioDeReglas.ts";

const toleranciaDeFaltasInicial = 3;

export class PantallaDeInicio {
  private _entorno: Entorno;
  private _errores: HTMLOutputElement;

  constructor(entorno: Entorno) {
    this._entorno = entorno;
    this._errores = alerta();
  }

  elemento(): HTMLElement {
    const errorDeCarga = this._entorno.aplicacion().errorDeCarga();
    const creacionAnterior = this._entorno.aplicacion().creacionDeshecha();
    return crear(
      "section",
      {},
      crear("h2", {}, "Crear el grupo"),
      errorDeCarga !== undefined && crear("p", { role: "alert" }, explicacionDeLaCargaFallida(errorDeCarga)),
      formulario(
        (completado) => this._crearGrupo(completado),
        campoDeTexto("Nombre del grupo", "nombreDelGrupo", creacionAnterior?.nombreDelGrupo() ?? ""),
        campoDeDesentrada(creacionAnterior?.reglas().desentrada(), explicacionDeLaDesentrada),
        this._errores,
        botonDeEnvio("Crear"),
      ),
      crear(
        "form",
        { onsubmit: (evento: Event) => evento.preventDefault() },
        crear("h3", {}, "Copia de seguridad"),
        ...new Importacion(this._entorno).elementos(),
      ),
    );
  }

  private _crearGrupo(formulario: HTMLFormElement): void {
    this._entorno.intentarYRefrescar(() => {
      const reglas = new Reglas(this._entorno.ahora(), toleranciaDeFaltasInicial, numeroDe(formulario, "desentrada"));
      this._entorno.aplicacion().crearGrupo(valorDe(formulario, "nombreDelGrupo"), reglas);
    }, this._errores);
  }
}
