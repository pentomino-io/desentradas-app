import { describe, expect, it } from "vitest";
import { DesempateAlfabetico, DesempateAleatorioReproducible } from "../../src/models/Desempate.ts";
import { garantiaPerdida } from "./factories.ts";

const nombres = ["carla", "ana", "beto", "dario", "elena", "fabio"];

describe("DesempateAlfabetico", () => {
  it("ordena los nombres alfabéticamente", () => {
    const orden = new DesempateAlfabetico().ordenar(nombres, garantiaPerdida());

    expect(orden).toEqual(["ana", "beto", "carla", "dario", "elena", "fabio"]);
  });
});

describe("DesempateAleatorioReproducible", () => {
  const desempate = new DesempateAleatorioReproducible();

  it("produce una permutación de los nombres", () => {
    const orden = desempate.ordenar(nombres, garantiaPerdida());

    expect(orden).toHaveLength(nombres.length);
    expect([...orden].sort()).toEqual([...nombres].sort());
  });

  it("no altera la lista de nombres recibida", () => {
    const originales = [...nombres];

    desempate.ordenar(nombres, garantiaPerdida());

    expect(nombres).toEqual(originales);
  });

  it("da el mismo orden para dos garantías perdidas con los mismos datos", () => {
    const primero = desempate.ordenar(nombres, garantiaPerdida({ persona: "ana", monto: 1000, numero: 3 }));
    const segundo = desempate.ordenar(nombres, garantiaPerdida({ persona: "ana", monto: 1000, numero: 3 }));

    expect(segundo).toEqual(primero);
  });

  it("da distinto orden para garantías perdidas con distinta persona, encuentro o monto", () => {
    const porMil = desempate.ordenar(nombres, garantiaPerdida({ monto: 1000 }));
    const porQuinientos = desempate.ordenar(nombres, garantiaPerdida({ monto: 500 }));
    const otroEncuentro = desempate.ordenar(nombres, garantiaPerdida({ numero: 4 }));
    const otraPersona = desempate.ordenar(nombres, garantiaPerdida({ persona: "beto" }));

    expect(porQuinientos).not.toEqual(porMil);
    expect(otroEncuentro).not.toEqual(porMil);
    expect(otraPersona).not.toEqual(porMil);
  });
});
