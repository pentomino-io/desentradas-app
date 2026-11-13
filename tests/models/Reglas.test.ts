import { describe, expect, it } from "vitest";
import { Reglas } from "../../src/models/Reglas.ts";
import { dia, reglas } from "./factories.ts";

describe("Reglas", () => {
  it("la tolerancia de faltas debe ser al menos 1", () => {
    expect(() => {
      new Reglas(dia(1), 0, 1000);
    }).toThrow("La tolerancia de faltas debe ser al menos 1");
  });

  it("la desentrada debe ser positiva", () => {
    expect(() => {
      new Reglas(dia(1), 2, 0);
    }).toThrow("La desentrada debe ser positiva");
  });

  it("conocen desde cuándo rigen, la tolerancia de faltas y la desentrada", () => {
    const reglas = new Reglas(dia(1), 2, 1000);

    expect(reglas.rigeDesde()).toEqual(dia(1));
    expect(reglas.toleranciaDeFaltas()).toBe(2);
    expect(reglas.desentrada()).toBe(1000);
  });

  it("se supera la tolerancia con más faltas que las toleradas", () => {
    const lasReglas = reglas({ toleranciaDeFaltas: 2 });

    expect(lasReglas.superaLaTolerancia(2)).toBe(false);
    expect(lasReglas.superaLaTolerancia(3)).toBe(true);
  });
});
