import type { Comando } from "../Comando.ts";
import { CrearGrupo } from "../comandos/CrearGrupo.ts";
import { Ingresar } from "../comandos/Ingresar.ts";
import { CobrarGarantia } from "../comandos/CobrarGarantia.ts";
import { RegistrarEncuentro } from "../comandos/RegistrarEncuentro.ts";
import { Repartir } from "../comandos/Repartir.ts";
import { CambiarReglas } from "../comandos/CambiarReglas.ts";
import { type Objeto, objeto, segunTipo } from "./Campos.ts";
import type { ReglasJson } from "./ReglasJson.ts";

export type ComandoJson =
  | { tipo: "crear grupo"; nombreDelGrupo: string; reglas: ReglasJson }
  | { tipo: "ingresar"; nombre: string; fecha: string }
  | { tipo: "cobrar garantía"; nombre: string; fecha: string }
  | { tipo: "registrar encuentro"; fecha: string; asistentes: readonly string[]; ausentes: readonly string[] }
  | { tipo: "repartir"; nombre: string; fecha: string }
  | { tipo: "cambiar reglas"; reglas: ReglasJson };

const lectores: Record<ComandoJson["tipo"], (campos: Objeto) => Comando> = {
  "crear grupo": CrearGrupo.desdeJson,
  ingresar: Ingresar.desdeJson,
  "cobrar garantía": CobrarGarantia.desdeJson,
  "registrar encuentro": RegistrarEncuentro.desdeJson,
  repartir: Repartir.desdeJson,
  "cambiar reglas": CambiarReglas.desdeJson,
};

export const comandoDesdeJson = (json: unknown): Comando =>
  segunTipo(objeto(json, "El comando"), lectores, "comando desconocido");
