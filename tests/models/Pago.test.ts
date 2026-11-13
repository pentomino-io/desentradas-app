import { describe, expect, it } from "vitest";
import { Pago } from "../../src/models/Pago.ts";
import { dia, nuevoCredito } from "./factories.ts";

describe("Pago", () => {
  it("le paga a su acreedor el total de sus créditos", () => {
    const creditos = [nuevoCredito({ acreedor: "beto", monto: 500 }), nuevoCredito({ acreedor: "beto", monto: 300 })];

    const pago = new Pago(dia(5), creditos);

    expect(pago.acreedor()).toBe("beto");
    expect(pago.monto()).toBe(800);
  });

  it("un pago saca de la caja el total de sus créditos", () => {
    const pago = new Pago(dia(5), [nuevoCredito({ acreedor: "beto", monto: 800 })]);

    const efecto = pago.efectoEnCaja();

    expect(efecto).toBe(-800);
  });

  it("se describe como el pago a su acreedor", () => {
    const pago = new Pago(dia(5), [nuevoCredito({ acreedor: "beto" })]);

    const descripcion = pago.describir();

    expect(descripcion).toBe("el pago a beto");
  });

  it("no se puede pagar sin créditos", () => {
    expect(() => {
      new Pago(dia(5), []);
    }).toThrow("Un pago necesita al menos un crédito");
  });
});
