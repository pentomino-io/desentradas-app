import { describe, expect, it } from "vitest";
import { Cobro } from "../../src/models/Cobro.ts";
import { dia } from "./factories.ts";

describe("Cobro", () => {
  it("un cobro es un movimiento de caja que registra a quién se le cobró, cuánto y cuándo", () => {
    const cobro = Cobro.alIngresar("ana", 1000, dia(3));

    expect(cobro.tipo()).toBe("cobro");
    expect(cobro.persona()).toBe("ana");
    expect(cobro.monto()).toBe(1000);
    expect(cobro.fecha()).toEqual(dia(3));
  });

  it("el cobro al ingresar se describe como el ingreso de la persona", () => {
    const cobro = Cobro.alIngresar("ana", 1000, dia(3));

    const descripcion = cobro.describir();

    expect(descripcion).toBe("ingreso de ana");
  });

  it("el cobro de una garantía se describe como tal, con la persona a quien se le cobró", () => {
    const cobro = Cobro.deGarantia("ana", 1000, dia(3), 0);

    const descripcion = cobro.describir();

    expect(descripcion).toBe("cobro de la garantía a ana");
  });

  it("el monto de un cobro debe ser positivo", () => {
    expect(() => {
      Cobro.alIngresar("ana", 0, dia(3));
    }).toThrow("El monto del cobro debe ser positivo");
  });
});
