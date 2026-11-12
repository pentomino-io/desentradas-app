import { fechaYHora, monto } from "../app/Formato.ts";
import type { Grupo } from "../models/Grupo.ts";
import type { Reglas } from "../models/Reglas.ts";
import type { CambioDeGarantia } from "../models/CambioDeGarantia.ts";
import { Dialogo } from "./Dialogo.ts";
import { alerta, botonDeEnvio, crear, desplegable, fila, formulario, intentar, tabla } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { camposDeReglas, explicacionDeLaGarantia, reglasDesde } from "./FormularioDeReglas.ts";
import { alfabetico } from "./Orden.ts";

const faltasSeguidas = (cantidad: number): string =>
  `${cantidad} ${cantidad === 1 ? "falta seguida" : "faltas seguidas"}`;

const valoresDe = (reglas: Reglas): string[] => [faltasSeguidas(reglas.toleranciaDeFaltas()), monto(reglas.garantia())];

const explicacionDeLaTolerancia =
  "Quien falta más veces seguidas deja de aparecer en la lista de asistencia; para volver hay que usar Reingresar, en Participantes.";

const formatoDeEnumeracion = new Intl.ListFormat("es-AR", { type: "conjunction" });
const enumeracion = (nombres: readonly string[]): string => formatoDeEnumeracion.format(nombres);

const efecto = (nombres: readonly string[], cambio: CambioDeGarantia): string => {
  const varios = nombres.length > 1;
  if (cambio.monto() > 0) {
    return `${enumeracion(nombres)} ${varios ? "reciben" : "recibe"} un crédito de ${monto(cambio.monto())}.`;
  }

  const deuda = `${enumeracion(nombres)} ${varios ? "deben" : "debe"} completar ${monto(-cambio.monto())}`;
  const cobertura = varios ? ", que pueden cubrir con sus créditos" : ", que puede cubrir con su crédito";
  const consecuencia = varios ? "hasta entonces no pueden asistir" : "hasta entonces no puede asistir";
  return `${deuda}${cambio.loCubrenSusCreditos() ? cobertura : ""}; ${consecuencia}.`;
};

const efectosEnLaPlata = (efectos: readonly CambioDeGarantia[]): string[] => {
  if (efectos.length === 0) return ["No cambia la plata de nadie."];

  const grupos = new Map<string, CambioDeGarantia[]>();
  const ordenados = efectos.toSorted(
    (uno, otro) => uno.monto() - otro.monto() || Number(uno.loCubrenSusCreditos()) - Number(otro.loCubrenSusCreditos()),
  );
  for (const cambio of ordenados) {
    const clave = `${cambio.monto()} ${cambio.loCubrenSusCreditos()}`;
    grupos.set(clave, [...(grupos.get(clave) ?? []), cambio]);
  }
  return [...grupos.values()].map((cambios) =>
    efecto(cambios.map((cambio) => cambio.nombre()).toSorted(alfabetico), cambios[0]),
  );
};

const cambiosEntre = (vigentes: Reglas, nuevas: Reglas): string[] => {
  const cambios = [];
  if (nuevas.toleranciaDeFaltas() !== vigentes.toleranciaDeFaltas()) {
    cambios.push(`La tolerancia de faltas pasa de ${vigentes.toleranciaDeFaltas()} a ${nuevas.toleranciaDeFaltas()}.`);
  }
  if (nuevas.garantia() !== vigentes.garantia()) {
    cambios.push(`La garantía pasa de ${monto(vigentes.garantia())} a ${monto(nuevas.garantia())}.`);
  }
  return cambios;
};

const descripcionDelCambio = (grupo: Grupo, reglas: Reglas): string => {
  const cambios = cambiosEntre(grupo.reglas(), reglas);
  if (cambios.length === 0) return "Las reglas quedan iguales.";

  return [...cambios, ...efectosEnLaPlata(grupo.efectosDeCambiarLasReglas(reglas))].join(" ");
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
      desplegable("Cambiar reglas", this._formularioDeCambio()),
      desplegable("Versiones anteriores", this._tablaDeVersiones()),
    );
  }

  private _reglasVigentes(): HTMLElement {
    const [tolerancia, garantia] = valoresDe(this._entorno.grupo().reglas());
    return crear(
      "dl",
      {},
      crear("dt", {}, "Tolerancia de faltas"),
      crear("dd", {}, tolerancia, crear("small", {}, explicacionDeLaTolerancia)),
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
    const descripcion = descripcionDelCambio(this._entorno.grupo(), reglas);
    new Dialogo(this._entorno, "Cambiar reglas", [crear("p", {}, descripcion)], "Confirmar", () =>
      this._entorno.aplicacion().cambiarReglas(reglas),
    ).abrir();
  }

  private _tablaDeVersiones(): HTMLElement | undefined {
    const anteriores = this._entorno.grupo().reglasAnteriores().toReversed();
    return tabla(
      undefined,
      ["Desde", "Tolerancia", "Garantía"],
      anteriores.map((reglas) => fila(fechaYHora(reglas.rigeDesde()), ...valoresDe(reglas))),
    );
  }
}
