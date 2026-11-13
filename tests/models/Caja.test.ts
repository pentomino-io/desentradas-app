import { describe, expect, it } from "vitest";
import { Caja } from "../../src/models/Caja.ts";
import { Cobro } from "../../src/models/Cobro.ts";
import { desempate, dia, desentrada, nuevoCredito } from "./factories.ts";

const nuevaCaja = () => new Caja(desempate);

const saldosAFavorDe = (caja: Caja, nombres: string[]) => nombres.map((nombre) => [nombre, caja.saldoAFavorDe(nombre)]);

describe("Caja", () => {
  describe("reparto de desentradas", () => {
    it("una desentrada se reparte en partes iguales entre los asistentes al encuentro faltado", () => {
      const caja = nuevaCaja();

      caja.repartir(desentrada({ monto: 1000, asistentes: ["beto", "carla"] }));

      expect(saldosAFavorDe(caja, ["beto", "carla"])).toEqual([
        ["beto", 500],
        ["carla", 500],
      ]);
    });

    it("cuando el monto no se divide en partes iguales, el sobrante va de a un peso a los primeros según el desempate", () => {
      const caja = nuevaCaja();

      caja.repartir(desentrada({ monto: 1000, asistentes: ["carla", "beto", "ana"] }));

      expect(saldosAFavorDe(caja, ["ana", "beto", "carla"])).toEqual([
        ["ana", 334],
        ["beto", 333],
        ["carla", 333],
      ]);
    });

    it("una desentrada menor a la cantidad de asistentes deja sin parte a los últimos según el desempate", () => {
      const caja = nuevaCaja();

      caja.repartir(desentrada({ monto: 2, asistentes: ["carla", "beto", "ana"] }));

      expect(saldosAFavorDe(caja, ["ana", "beto", "carla"])).toEqual([
        ["ana", 1],
        ["beto", 1],
        ["carla", 0],
      ]);
    });
  });

  describe("saldos a favor", () => {
    it("un crédito acreditado suma al saldo a favor de su acreedor", () => {
      const caja = nuevaCaja();

      caja.acreditar(nuevoCredito({ acreedor: "beto", monto: 200 }));

      expect(caja.saldoAFavorDe("beto")).toBe(200);
    });

    it("conoce el saldo a favor de cada uno y el total de saldos a favor", () => {
      const caja = nuevaCaja();
      caja.repartir(desentrada({ monto: 1000 }));
      caja.repartir(desentrada({ monto: 300, asistentes: ["beto"] }));

      expect(caja.saldoAFavorDe("beto")).toBe(800);
      expect(caja.saldoAFavorDe("carla")).toBe(500);
      expect(caja.saldoAFavorDe("dario")).toBe(0);
      expect(caja.totalDeSaldosAFavor()).toBe(1300);
    });
  });

  describe("pagos", () => {
    it("pagar le paga a una persona todo su saldo a favor de una vez, sin tocar el de los demás", () => {
      const caja = nuevaCaja();
      caja.repartir(desentrada({ monto: 1000 }));
      caja.repartir(desentrada({ monto: 300, asistentes: ["beto"] }));
      const creditosDeBeto = caja.creditosPendientesDe("beto");

      const pago = caja.pagar("beto", dia(5));

      expect(pago.acreedor()).toBe("beto");
      expect(pago.fecha()).toEqual(dia(5));
      expect(pago.monto()).toBe(800);
      expect(pago.creditos()).toEqual(creditosDeBeto);
      expect(caja.creditosPendientesDe("beto")).toEqual([]);
      expect(caja.saldoAFavorDe("carla")).toBe(500);
      expect(caja.pagos()).toEqual([pago]);
    });

    it("no se puede pagar a quien no tiene saldo a favor", () => {
      const caja = nuevaCaja();

      expect(() => {
        caja.pagar("beto", dia(5));
      }).toThrow("beto no tiene saldo a favor");
      expect(caja.pagos()).toEqual([]);
    });
  });

  describe("movimientos", () => {
    it("los movimientos son los cobros y los pagos, en orden cronológico, sin las desentradas", () => {
      const caja = nuevaCaja();
      caja.cobrar(Cobro.deGarantia("ana", 1000, dia(1), 0));
      caja.repartir(desentrada({ persona: "ana", monto: 1000, numero: 3, asistentes: ["beto"] }));
      caja.pagar("beto", dia(5));
      caja.cobrar(Cobro.deGarantia("dario", 300, dia(6), 0));

      const movimientos = caja.movimientos();

      expect(
        movimientos.map((movimiento) => [movimiento.fecha(), movimiento.persona(), movimiento.efectoEnCaja()]),
      ).toEqual([
        [dia(1), "ana", 1000],
        [dia(5), "beto", -1000],
        [dia(6), "dario", 300],
      ]);
    });

    it("el total en caja es lo cobrado en efectivo menos lo pagado", () => {
      const caja = nuevaCaja();
      caja.cobrar(Cobro.deGarantia("ana", 1000, dia(1), 0));
      caja.repartir(desentrada({ persona: "ana", monto: 1000, numero: 2, asistentes: ["beto", "carla"] }));
      caja.cobrar(Cobro.deGarantia("beto", 800, dia(3), 500));
      caja.pagar("carla", dia(4));

      const total = caja.totalEnCaja();

      expect(total).toBe(800);
    });

    it("un cobro no deja saldo a favor", () => {
      const caja = nuevaCaja();

      caja.cobrar(Cobro.deGarantia("ana", 1000, dia(1), 0));

      expect(caja.totalDeSaldosAFavor()).toBe(0);
    });
  });
});
