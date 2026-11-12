import { describe, expect, it } from "vitest";
import { Reglas } from "../../src/models/Reglas.ts";
import { dia, nuevoEncuentro, reglas } from "./factories.ts";

describe("Reglas", () => {
  it("la tolerancia de faltas debe ser al menos 1", () => {
    expect(() => {
      new Reglas(dia(1), 0, 1000);
    }).toThrow("La tolerancia de faltas debe ser al menos 1");
  });

  it("el monto por falta debe ser positivo", () => {
    expect(() => {
      new Reglas(dia(1), 2, 0);
    }).toThrow("El monto por falta debe ser positivo");
  });

  it("conocen desde cuándo rigen, la tolerancia de faltas y el monto por falta", () => {
    const reglas = new Reglas(dia(1), 2, 1000);

    expect(reglas.rigeDesde()).toEqual(dia(1));
    expect(reglas.toleranciaDeFaltas()).toBe(2);
    expect(reglas.montoPorFalta()).toBe(1000);
  });

  it("se supera la tolerancia con más faltas que las toleradas", () => {
    const lasReglas = reglas({ toleranciaDeFaltas: 2 });

    expect(lasReglas.superaLaTolerancia(2)).toBe(false);
    expect(lasReglas.superaLaTolerancia(3)).toBe(true);
  });

  it("la deuda por faltar a un encuentro es por el monto por falta", () => {
    const lasReglas = reglas({ montoPorFalta: 1000 });
    const encuentro = nuevoEncuentro();

    const deuda = lasReglas.deudaPorFaltarA(encuentro);

    expect(deuda.monto()).toBe(1000);
    expect(deuda.encuentroFaltado()).toBe(encuentro);
  });
});
