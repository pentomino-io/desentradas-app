import { campoDeTexto } from "./Campos.ts";
import { alerta, botonDeEnvio, crear, formulario, valorDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { explicacionDeLaCargaFallida } from "./ExplicacionDeErrores.ts";
import { Importacion } from "./Importacion.ts";
import { camposDeReglas, explicacionDeLaGarantia, reglasDesde } from "./FormularioDeReglas.ts";

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
        ...camposDeReglas(creacionAnterior?.reglas(), explicacionDeLaGarantia),
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
      const reglas = reglasDesde(formulario, this._entorno.ahora());
      this._entorno.aplicacion().crearGrupo(valorDe(formulario, "nombreDelGrupo"), reglas);
    }, this._errores);
  }
}
