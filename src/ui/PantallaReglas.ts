import { fechaYHora, monto } from "../app/Formato.ts";
import type { Reglas } from "../models/Reglas.ts";
import { alerta, botonDeEnvio, crear, desplegable, fila, formulario, tabla } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { camposDeReglas, reglasDesde } from "./FormularioDeReglas.ts";

const valoresDe = (reglas: Reglas): string[] => [String(reglas.toleranciaDeFaltas()), monto(reglas.garantia())];

export class PantallaReglas {
  private _entorno: Entorno;
  private _errores: HTMLOutputElement;

  constructor(entorno: Entorno) {
    this._entorno = entorno;
    this._errores = alerta();
  }

  elemento(): HTMLElement {
    return crear(
      "section",
      {},
      crear("h2", {}, "Reglas"),
      this._reglasVigentes(),
      desplegable("Cambiar las reglas", this._formularioDeCambio()),
      desplegable("Versiones anteriores", this._tablaDeVersiones()),
    );
  }

  private _reglasVigentes(): HTMLElement {
    const titulos = ["Tolerancia de faltas", "Garantía"];
    const valores = valoresDe(this._entorno.grupo().reglas());
    return crear(
      "dl",
      {},
      ...titulos.flatMap((titulo, posicion) => [crear("dt", {}, titulo), crear("dd", {}, valores[posicion])]),
    );
  }

  private _formularioDeCambio(): HTMLFormElement {
    return formulario(
      (completado) => this._cambiar(completado),
      ...camposDeReglas(this._entorno.grupo().reglas()),
      this._errores,
      crear("p", {}, botonDeEnvio("Cambiar reglas")),
    );
  }

  private _cambiar(formulario: HTMLFormElement): void {
    this._entorno.intentarYRefrescar(() => {
      this._entorno.aplicacion().cambiarReglas(reglasDesde(formulario, this._entorno.ahora()));
    }, this._errores);
  }

  private _tablaDeVersiones(): HTMLElement | undefined {
    const anteriores = this._entorno.grupo().reglasAnteriores().toReversed();
    return tabla(
      undefined,
      ["Rigieron desde", "Tolerancia", "Garantía"],
      anteriores.map((reglas) => fila(fechaYHora(reglas.rigeDesde()), ...valoresDe(reglas))),
    );
  }
}
