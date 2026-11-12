import type { Asistencia, Comando } from "../app/Comando.ts";
import { fechaYHora } from "../app/Formato.ts";
import { Dialogo, mostrarEnDialogo } from "./Dialogo.ts";
import { alerta, boton, crear, descargar, fila, intentar, tabla } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { alfabetico } from "./Orden.ts";

export class PantallaHistorial {
  private _entorno: Entorno;
  private _errores: HTMLOutputElement;

  constructor(entorno: Entorno) {
    this._entorno = entorno;
    this._errores = alerta();
  }

  elemento(): HTMLElement {
    return crear("section", {}, crear("h2", {}, "Historial"), this._errores, this._tabla(), this._copiaDeSeguridad());
  }

  private _copiaDeSeguridad(): HTMLElement {
    const archivo = crear("input", {
      type: "file",
      name: "archivo",
      accept: ".json,application/json",
      onchange: () => this._leerParaImportar(archivo),
    });
    return crear(
      "form",
      { onsubmit: (evento: Event) => evento.preventDefault() },
      crear("h3", {}, "Copia de seguridad"),
      boton("Exportar", () => this._exportar()),
      crear("label", {}, "Importar ", archivo),
    );
  }

  private _exportar(): void {
    descargar(`${this._entorno.grupo().nombre()}.json`, this._entorno.aplicacion().exportar(), "application/json");
  }

  private _leerParaImportar(entrada: HTMLInputElement): void {
    const archivo = entrada.files?.[0];
    if (archivo === undefined) return;

    archivo.text().then(
      (texto) => this._confirmarImportacion(archivo.name, texto),
      () => (this._errores.textContent = "No se pudo leer el archivo"),
    );
    entrada.value = "";
  }

  private _confirmarImportacion(nombreDelArchivo: string, texto: string): void {
    const aviso = crear(
      "p",
      {},
      `Se va a reemplazar todo lo guardado en este dispositivo por el contenido de "${nombreDelArchivo}".`,
    );
    new Dialogo(this._entorno, "Importar", [aviso], "Reemplazar", () => {
      this._entorno.aplicacion().importar(texto);
    }).abrir();
  }

  private _tabla(): HTMLElement | undefined {
    const comandos = this._entorno.aplicacion().comandos().toReversed();
    return tabla(
      undefined,
      ["Fecha", "Qué pasó", ""],
      comandos.map((comando, posicion) => this._filaDe(comando, posicion === 0)),
    );
  }

  private _filaDe(comando: Comando, esElUltimo: boolean): HTMLTableRowElement {
    return fila(fechaYHora(comando.fecha()), comando.describir(), this._accionesSobre(comando, esElUltimo));
  }

  private _accionesSobre(comando: Comando, esElUltimo: boolean): HTMLElement {
    const asistencia = comando.asistencia();
    return crear(
      "span",
      {},
      asistencia !== undefined && boton("Ver", () => this._verAsistencia(comando.fecha(), asistencia)),
      " ",
      esElUltimo && boton("Deshacer", () => this._deshacer(comando)),
    );
  }

  private _verAsistencia(fecha: Date, asistencia: Asistencia): void {
    const presentes = new Set(asistencia.presentes);
    const filas = [...asistencia.presentes, ...asistencia.ausentes]
      .toSorted(alfabetico)
      .map((nombre) => fila(nombre, presentes.has(nombre) ? "presente" : "ausente"));
    mostrarEnDialogo(
      this._entorno,
      `Encuentro del ${fechaYHora(fecha)}`,
      "Cerrar",
      tabla(undefined, ["Nombre", "Asistencia"], filas),
    );
  }

  private _deshacer(comando: Comando): void {
    if (comando.asistencia() !== undefined && this._hayMarcasDeAsistencia()) {
      new Dialogo(
        this._entorno,
        "¿Deshacer el encuentro?",
        [crear("p", {}, "Hay una planilla de asistencia empezada. Se va a reemplazar por la del encuentro deshecho.")],
        "Sí, deshacer",
        () => this._entorno.deshacer(),
      )
        .conTextoDeCancelacion("No, volver")
        .abrir();
    } else {
      intentar(() => this._entorno.deshacer(), this._errores);
    }
  }

  private _hayMarcasDeAsistencia(): boolean {
    const aplicacion = this._entorno.aplicacion();
    return aplicacion.tienePlanillaDeAsistencia() && aplicacion.planillaDeAsistencia().asistentes().length > 0;
  }
}
