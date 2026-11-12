import { describe, expect, it } from "vitest";
import { Cobro } from "../../src/models/Cobro.ts";
import { dia } from "./factories.ts";

describe("Cobro", () => {
  it("un cobro es un movimiento de caja que registra a quién se le cobró, cuánto y cuándo", () => {
    const cobro = new Cobro("ana", 1000, dia(3));

    expect(cobro.tipo()).toBe("cobro");
    expect(cobro.persona()).toBe("ana");
    expect(cobro.monto()).toBe(1000);
    expect(cobro.fecha()).toEqual(dia(3));
  });

  it("el monto de un cobro debe ser positivo", () => {
    expect(() => {
      new Cobro("ana", 0, dia(3));
    }).toThrow("El monto del cobro debe ser positivo");
  });
});
