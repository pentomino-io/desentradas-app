import { Reglas } from "../../models/Reglas.ts";
import { fecha, numero, objeto } from "./Campos.ts";

export type ReglasJson = { rigeDesde: string; toleranciaDeFaltas: number; garantia: number };

export const reglasAJson = (reglas: Reglas): ReglasJson => ({
  rigeDesde: reglas.rigeDesde().toISOString(),
  toleranciaDeFaltas: reglas.toleranciaDeFaltas(),
  garantia: reglas.desentrada(),
});

export const reglasDesdeJson = (json: unknown): Reglas => {
  const campos = objeto(json, "Las reglas");
  return new Reglas(fecha(campos, "rigeDesde"), numero(campos, "toleranciaDeFaltas"), numero(campos, "garantia"));
};
