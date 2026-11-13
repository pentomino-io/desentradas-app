import type { Comando } from "./Comando.ts";
import { comandoDesdeJson, type ComandoJson } from "./json/ComandoJson.ts";
import { lista, numero, objeto } from "./json/Campos.ts";
import { migrarDesdeLaVersion2 } from "./json/MigracionDesdeLaVersion2.ts";
import type { Desempate } from "../models/Desempate.ts";
import type { Grupo } from "../models/Grupo.ts";

const VERSION = 3;

abstract class VersionDistinta extends Error {
  constructor(version: number) {
    super(`Versión de bitácora ${version}; esta app lee la ${VERSION}`);
  }
}

export class VersionAnterior extends VersionDistinta {}

export class VersionPosterior extends VersionDistinta {}

export type BitacoraJson = { version: typeof VERSION; comandos: ComandoJson[] };

// El grupo es siempre el resultado de ejecutar todos los comandos en orden.
export class Bitacora {
  private _desempate: Desempate;
  private _comandos: Comando[];
  private _grupo: Grupo | undefined;

  static desdeJson(json: unknown, desempate: Desempate): Bitacora {
    const campos = objeto(json, "La bitácora");
    const version = numero(campos, "version");
    if (version === 2) return Bitacora.desdeJson(migrarDesdeLaVersion2(campos), desempate);
    if (version < VERSION) throw new VersionAnterior(version);
    if (version > VERSION) throw new VersionPosterior(version);

    const bitacora = new Bitacora(desempate);
    lista(campos, "comandos").forEach((comando) => bitacora.ejecutar(comandoDesdeJson(comando)));
    return bitacora;
  }

  constructor(desempate: Desempate) {
    this._desempate = desempate;
    this._comandos = [];
    this._grupo = undefined;
  }

  ejecutar(comando: Comando): void {
    this._grupo = comando.ejecutar(this._grupo, this._desempate);
    this._comandos.push(comando);
  }

  deshacer(): Comando {
    if (!this.puedeDeshacer()) throw new Error("No hay nada que deshacer");

    const deshecho = this._comandos.pop()!;
    this._reconstruirElGrupo();
    return deshecho;
  }

  puedeDeshacer(): boolean {
    return this._comandos.length > 0;
  }

  comandos(): readonly Comando[] {
    return this._comandos;
  }

  tieneGrupo(): boolean {
    return this._grupo !== undefined;
  }

  grupo(): Grupo {
    if (this._grupo === undefined) throw new Error("El grupo no está creado");

    return this._grupo;
  }

  aJson(): BitacoraJson {
    return { version: VERSION, comandos: this._comandos.map((comando) => comando.aJson()) };
  }

  private _reconstruirElGrupo(): void {
    const comandos = this._comandos;
    this._comandos = [];
    this._grupo = undefined;
    comandos.forEach((comando) => this.ejecutar(comando));
  }
}
