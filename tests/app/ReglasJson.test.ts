import { describe, expect, it } from "vitest";
import { reglasAJson, reglasDesdeJson } from "../../src/app/json/ReglasJson.ts";
import { dia, reglas } from "../models/factories.ts";

describe("Reglas en JSON", () => {
  it("las reglas se convierten a JSON con la fecha en formato ISO y vuelven iguales", () => {
    const originales = reglas({ rigeDesde: dia(1), toleranciaDeFaltas: 2, desentrada: 1000 });

    const json = reglasAJson(originales);
    const leidas = reglasDesdeJson(json);

    expect(json).toEqual({
      rigeDesde: dia(1).toISOString(),
      toleranciaDeFaltas: 2,
      garantia: 1000,
    });
    expect(leidas.rigeDesde()).toEqual(dia(1));
    expect(leidas.toleranciaDeFaltas()).toBe(2);
    expect(leidas.desentrada()).toBe(1000);
  });

  it("no se pueden leer reglas con una fecha que no está en formato ISO", () => {
    expect(() => {
      reglasDesdeJson({ ...reglasAJson(reglas()), rigeDesde: "ayer" });
    }).toThrow('Formato inválido: "rigeDesde" debe ser una fecha en formato ISO');
  });
});
