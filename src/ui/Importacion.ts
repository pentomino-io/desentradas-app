import { Dialogo } from "./Dialogo.ts";
import { alerta, crear, ErrorExplicado, type Hijo } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";
import { explicacionDeLaImportacionFallida } from "./ExplicacionDeErrores.ts";

export class Importacion {
  private _entorno: Entorno;
  private _errores: HTMLOutputElement;

  constructor(entorno: Entorno) {
    this._entorno = entorno;
    this._errores = alerta();
  }

  elementos(): Hijo[] {
    const archivo = crear("input", {
      type: "file",
      name: "archivo",
      accept: ".json,application/json",
      onchange: () => this._leer(archivo),
    });
    return [crear("label", {}, "Importar ", archivo), this._errores];
  }

  private _leer(entrada: HTMLInputElement): void {
    const archivo = entrada.files?.[0];
    if (archivo === undefined) return;

    this._errores.textContent = "";
    archivo.text().then(
      (texto) => this._confirmar(archivo.name, texto),
      () => (this._errores.textContent = "No se pudo leer el archivo. Probá elegirlo de nuevo."),
    );
    entrada.value = "";
  }

  private _confirmar(nombreDelArchivo: string, texto: string): void {
    const aviso = crear(
      "p",
      {},
      `Se va a reemplazar todo lo guardado en este dispositivo por el contenido de "${nombreDelArchivo}". No se puede deshacer: si querés conservar lo actual, exportalo antes.`,
    );
    new Dialogo(this._entorno, "¿Reemplazar los datos?", [aviso], "Reemplazar", () => this._importar(texto)).abrir();
  }

  private _importar(texto: string): void {
    try {
      this._entorno.aplicacion().importar(texto);
    } catch (error) {
      throw new ErrorExplicado(explicacionDeLaImportacionFallida(error), error);
    }
  }
}
