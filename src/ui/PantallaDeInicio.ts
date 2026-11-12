import { campoDeTexto } from "./Campos.ts";
import { alerta, botonDeEnvio, crear, formulario, valorDe } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { camposDeReglas, explicacionDeLaGarantia, reglasDesde } from "./FormularioDeReglas.ts";

export class PantallaDeInicio {
  private _entorno: Entorno;
  private _errores: HTMLOutputElement;

  constructor(entorno: Entorno) {
    this._entorno = entorno;
    this._errores = alerta();
  }

  elemento(): HTMLElement {
    const aviso = this._entorno.aplicacion().avisoDeInicio();
    const creacionAnterior = this._entorno.aplicacion().creacionDeshecha();
    return crear(
      "section",
      {},
      crear("h2", {}, "Crear el grupo"),
      aviso !== undefined && crear("p", { role: "alert" }, aviso),
      formulario(
        (completado) => this._crearGrupo(completado),
        campoDeTexto("Nombre del grupo", "nombreDelGrupo", creacionAnterior?.nombreDelGrupo() ?? ""),
        ...camposDeReglas(creacionAnterior?.reglas(), explicacionDeLaGarantia),
        this._errores,
        botonDeEnvio("Crear"),
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
