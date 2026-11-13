import { describe, expect, it } from "vitest";
import { Reparto } from "../../src/models/Reparto.ts";
import { dia, nuevoCredito } from "./factories.ts";

describe("Reparto", () => {
  it("entrega a su acreedor el total de sus créditos", () => {
    const creditos = [nuevoCredito({ acreedor: "beto", monto: 500 }), nuevoCredito({ acreedor: "beto", monto: 300 })];

    const reparto = new Reparto(dia(5), creditos);

    expect(reparto.acreedor()).toBe("beto");
    expect(reparto.monto()).toBe(800);
  });

  it("una entrega saca de la caja el total de sus créditos", () => {
    const reparto = new Reparto(dia(5), [nuevoCredito({ acreedor: "beto", monto: 800 })]);

    const efecto = reparto.efectoEnCaja();

    expect(efecto).toBe(-800);
  });

  it("se describe como la entrega a su acreedor", () => {
    const reparto = new Reparto(dia(5), [nuevoCredito({ acreedor: "beto" })]);

    const descripcion = reparto.describir();

    expect(descripcion).toBe("el pago a beto");
  });

  it("no se puede repartir sin créditos", () => {
    expect(() => {
      new Reparto(dia(5), []);
    }).toThrow("Un reparto necesita al menos un crédito");
  });
});
