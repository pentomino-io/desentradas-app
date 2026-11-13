import { describe, expect, it } from "vitest";
import { Caja } from "../../src/models/Caja.ts";
import { Cobro } from "../../src/models/Cobro.ts";
import { desempate, dia, garantiaPerdida, nuevoCredito } from "./factories.ts";

const nuevaCaja = () => new Caja(desempate);

const montosPendientesDe = (caja: Caja, nombres: string[]) =>
  nombres.map((nombre) => [nombre, caja.montoPendienteDe(nombre)]);

describe("Caja", () => {
  describe("reparto de garantías perdidas", () => {
    it("una garantía perdida se reparte en créditos iguales entre los asistentes al encuentro faltado", () => {
      const caja = nuevaCaja();

      caja.repartir(garantiaPerdida({ monto: 1000, asistentes: ["beto", "carla"] }));

      expect(montosPendientesDe(caja, ["beto", "carla"])).toEqual([
        ["beto", 500],
        ["carla", 500],
      ]);
    });

    it("cuando el monto no se divide en partes iguales, el sobrante va de a un peso a los primeros según el desempate", () => {
      const caja = nuevaCaja();

      caja.repartir(garantiaPerdida({ monto: 1000, asistentes: ["carla", "beto", "ana"] }));

      expect(montosPendientesDe(caja, ["ana", "beto", "carla"])).toEqual([
        ["ana", 334],
        ["beto", 333],
        ["carla", 333],
      ]);
    });

    it("una garantía perdida menor a la cantidad de asistentes deja sin crédito a los últimos según el desempate", () => {
      const caja = nuevaCaja();

      caja.repartir(garantiaPerdida({ monto: 2, asistentes: ["carla", "beto", "ana"] }));

      expect(montosPendientesDe(caja, ["ana", "beto", "carla"])).toEqual([
        ["ana", 1],
        ["beto", 1],
        ["carla", 0],
      ]);
    });
  });

  describe("créditos pendientes", () => {
    it("un crédito acreditado queda pendiente para su acreedor", () => {
      const caja = nuevaCaja();

      caja.acreditar(nuevoCredito({ acreedor: "beto", monto: 200 }));

      expect(caja.montoPendienteDe("beto")).toBe(200);
    });

    it("conoce el monto de los créditos pendientes, por nombre y en total", () => {
      const caja = nuevaCaja();
      caja.repartir(garantiaPerdida({ monto: 1000 }));
      caja.repartir(garantiaPerdida({ monto: 300, asistentes: ["beto"] }));

      expect(caja.montoPendienteDe("beto")).toBe(800);
      expect(caja.montoPendienteDe("carla")).toBe(500);
      expect(caja.montoPendienteDe("dario")).toBe(0);
      expect(caja.totalPendiente()).toBe(1300);
    });
  });

  describe("pagos", () => {
    it("pagar salda de una vez todos los créditos pendientes de una persona", () => {
      const caja = nuevaCaja();
      caja.repartir(garantiaPerdida({ monto: 1000 }));
      caja.repartir(garantiaPerdida({ monto: 300, asistentes: ["beto"] }));
      const creditosDeBeto = caja.creditosPendientesDe("beto");

      const pago = caja.pagar("beto", dia(5));

      expect(pago.acreedor()).toBe("beto");
      expect(pago.fecha()).toEqual(dia(5));
      expect(pago.monto()).toBe(800);
      expect(pago.creditos()).toEqual(creditosDeBeto);
      expect(caja.creditosPendientesDe("beto")).toEqual([]);
      expect(caja.montoPendienteDe("carla")).toBe(500);
      expect(caja.pagos()).toEqual([pago]);
    });

    it("no se puede pagar a quien no tiene créditos pendientes", () => {
      const caja = nuevaCaja();

      expect(() => {
        caja.pagar("beto", dia(5));
      }).toThrow("beto no tiene saldo a favor");
      expect(caja.pagos()).toEqual([]);
    });
  });

  describe("movimientos", () => {
    it("los movimientos son los cobros y los pagos, en orden cronológico, sin las garantías perdidas", () => {
      const caja = nuevaCaja();
      caja.cobrar(Cobro.alIngresar("ana", 1000, dia(1)));
      caja.repartir(garantiaPerdida({ persona: "ana", monto: 1000, numero: 3, asistentes: ["beto"] }));
      caja.pagar("beto", dia(5));
      caja.cobrar(Cobro.alIngresar("dario", 300, dia(6)));

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
      caja.cobrar(Cobro.alIngresar("ana", 1000, dia(1)));
      caja.repartir(garantiaPerdida({ persona: "ana", monto: 1000, numero: 2, asistentes: ["beto", "carla"] }));
      caja.cobrar(Cobro.deGarantia("beto", 800, dia(3), 500));
      caja.pagar("carla", dia(4));

      const total = caja.totalEnCaja();

      expect(total).toBe(800);
    });

    it("un cobro no genera créditos", () => {
      const caja = nuevaCaja();

      caja.cobrar(Cobro.alIngresar("ana", 1000, dia(1)));

      expect(caja.totalPendiente()).toBe(0);
    });
  });
});
