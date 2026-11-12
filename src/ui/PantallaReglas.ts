import { fechaYHora, monto } from "../app/Formato.ts";
import type { Reglas } from "../models/Reglas.ts";
import type { CambioDeGarantia } from "../models/CambioDeGarantia.ts";
import { Dialogo } from "./Dialogo.ts";
import { alerta, botonDeEnvio, crear, desplegable, fila, formulario, intentar, tabla } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { camposDeReglas, explicacionDeLaGarantia, reglasDesde } from "./FormularioDeReglas.ts";
import { alfabetico } from "./Orden.ts";

const valoresDe = (reglas: Reglas): string[] => [String(reglas.toleranciaDeFaltas()), monto(reglas.garantia())];

const formatoDeEnumeracion = new Intl.ListFormat("es-AR", { type: "conjunction" });
const enumeracion = (nombres: readonly string[]): string => formatoDeEnumeracion.format(nombres);

const efecto = (nombres: readonly string[], cambio: CambioDeGarantia): string => {
  const varios = nombres.length > 1;
  if (cambio.monto() > 0) {
    return `${enumeracion(nombres)} ${varios ? "reciben" : "recibe"} un crédito de ${monto(cambio.monto())}`;
  }

  const deuda = `${enumeracion(nombres)} ${varios ? "deben" : "debe"} completar ${monto(-cambio.monto())}`;
  return cambio.loCubrenSusCreditos() ? `${deuda}, que ${varios ? "pueden" : "puede"} cubrir con sus créditos` : deuda;
};

const descripcionDe = (efectos: readonly CambioDeGarantia[]): string => {
  if (efectos.length === 0) return "No cambia la plata de nadie.";

  const grupos = new Map<string, CambioDeGarantia[]>();
  const ordenados = efectos.toSorted(
    (uno, otro) => uno.monto() - otro.monto() || Number(uno.loCubrenSusCreditos()) - Number(otro.loCubrenSusCreditos()),
  );
  for (const cambio of ordenados) {
    const clave = `${cambio.monto()} ${cambio.loCubrenSusCreditos()}`;
    grupos.set(clave, [...(grupos.get(clave) ?? []), cambio]);
  }
  const frases = [...grupos.values()].map((cambios) =>
    efecto(cambios.map((cambio) => cambio.nombre()).toSorted(alfabetico), cambios[0]),
  );
  return `${frases.join("; ")}.`;
};

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
    const [tolerancia, garantia] = valoresDe(this._entorno.grupo().reglas());
    return crear(
      "dl",
      {},
      crear("dt", {}, "Tolerancia de faltas"),
      crear("dd", {}, tolerancia),
      crear("dt", {}, "Garantía"),
      crear("dd", {}, garantia, crear("small", {}, explicacionDeLaGarantia)),
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
    intentar(() => this._confirmarCambio(reglasDesde(formulario, this._entorno.ahora())), this._errores);
  }

  private _confirmarCambio(reglas: Reglas): void {
    const efectos = this._entorno.grupo().efectosDeCambiarLasReglas(reglas);
    new Dialogo(this._entorno, "Cambiar reglas", [crear("p", {}, descripcionDe(efectos))], "Confirmar", () =>
      this._entorno.aplicacion().cambiarReglas(reglas),
    ).abrir();
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
