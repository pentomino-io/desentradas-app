import { describe, expect, it } from "vitest";
import { Cobro } from "../../src/models/Cobro.ts";
import { dia } from "./factories.ts";

describe("Cobro", () => {
  it("un cobro es un movimiento de caja que registra a quién se le cobró, cuánto y cuándo", () => {
    const cobro = Cobro.deGarantia("ana", 1000, dia(3), 0);

    expect(cobro.persona()).toBe("ana");
    expect(cobro.monto()).toBe(1000);
    expect(cobro.fecha()).toEqual(dia(3));
  });

  it("un cobro hace entrar a la caja sólo lo cobrado en efectivo, sin lo cubierto con saldo a favor", () => {
    const cobro = Cobro.deGarantia("ana", 1000, dia(3), 400);

    const efecto = cobro.efectoEnCaja();

    expect(efecto).toBe(600);
  });

  it("el cobro de una garantía se describe como tal, con la persona a quien se le cobró", () => {
    const cobro = Cobro.deGarantia("ana", 1000, dia(3), 0);

    const descripcion = cobro.describir();

    expect(descripcion).toBe("el cobro de la garantía a ana");
  });

  it("el monto de un cobro debe ser positivo", () => {
    expect(() => {
      Cobro.deGarantia("ana", 0, dia(3), 0);
    }).toThrow("El monto del cobro debe ser positivo");
  });
});
