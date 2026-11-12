import { Reglas } from "../../models/Reglas.ts";
import { fecha, numero, objeto } from "./Campos.ts";

export type ReglasJson = { rigeDesde: string; toleranciaDeFaltas: number; montoPorFalta: number };

export const reglasAJson = (reglas: Reglas): ReglasJson => ({
  rigeDesde: reglas.rigeDesde().toISOString(),
  toleranciaDeFaltas: reglas.toleranciaDeFaltas(),
  montoPorFalta: reglas.montoPorFalta(),
});

export const reglasDesdeJson = (json: unknown): Reglas => {
  const campos = objeto(json, "Las reglas");
  return new Reglas(fecha(campos, "rigeDesde"), numero(campos, "toleranciaDeFaltas"), numero(campos, "montoPorFalta"));
};
