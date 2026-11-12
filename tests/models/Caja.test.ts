import { describe, expect, it } from "vitest";
import { Caja } from "../../src/models/Caja.ts";
import { Cobro } from "../../src/models/Cobro.ts";
import { desempate, dia, garantiaPerdida } from "./factories.ts";

const nuevaCaja = () => new Caja(desempate);

const montosPendientesDe = (caja: Caja, nombres: string[]) =>
  nombres.map((nombre) => [nombre, caja.montoPendienteDe(nombre)]);

describe("Caja", () => {
  describe("distribución de garantías perdidas", () => {
    it("una garantía perdida se distribuye en créditos iguales entre los asistentes al encuentro faltado", () => {
      const caja = nuevaCaja();

      caja.distribuir(garantiaPerdida({ monto: 1000, asistentes: ["beto", "carla"] }));

      expect(montosPendientesDe(caja, ["beto", "carla"])).toEqual([
        ["beto", 500],
        ["carla", 500],
      ]);
    });

    it("cuando el monto no se divide en partes iguales, el sobrante va de a un peso a los primeros según el desempate", () => {
      const caja = nuevaCaja();

      caja.distribuir(garantiaPerdida({ monto: 1000, asistentes: ["carla", "beto", "ana"] }));

      expect(montosPendientesDe(caja, ["ana", "beto", "carla"])).toEqual([
        ["ana", 334],
        ["beto", 333],
        ["carla", 333],
      ]);
    });

    it("una garantía perdida menor a la cantidad de asistentes deja sin crédito a los últimos según el desempate", () => {
      const caja = nuevaCaja();

      caja.distribuir(garantiaPerdida({ monto: 2, asistentes: ["carla", "beto", "ana"] }));

      expect(caja.nombresConCreditosPendientes()).toEqual(["ana", "beto"]);
    });
  });

  describe("créditos pendientes", () => {
    it("conoce el monto de los créditos pendientes, por nombre y en total", () => {
      const caja = nuevaCaja();
      caja.distribuir(garantiaPerdida({ monto: 1000 }));
      caja.distribuir(garantiaPerdida({ monto: 300, asistentes: ["beto"] }));

      expect(caja.montoPendienteDe("beto")).toBe(800);
      expect(caja.montoPendienteDe("carla")).toBe(500);
      expect(caja.montoPendienteDe("dario")).toBe(0);
      expect(caja.totalPendiente()).toBe(1300);
    });

    it("conoce los nombres con créditos pendientes, sin repetir y en el orden en que aparecieron", () => {
      const caja = nuevaCaja();
      caja.distribuir(garantiaPerdida({ monto: 1000, asistentes: ["dario", "carla"] }));
      caja.distribuir(garantiaPerdida({ monto: 300, asistentes: ["beto"] }));
      caja.distribuir(garantiaPerdida({ monto: 200, asistentes: ["dario"] }));
      caja.repartir("carla", dia(4));

      expect(caja.nombresConCreditosPendientes()).toEqual(["dario", "beto"]);
    });
  });

  describe("repartos", () => {
    it("repartir entrega de una vez todos los créditos pendientes de una persona", () => {
      const caja = nuevaCaja();
      caja.distribuir(garantiaPerdida({ monto: 1000 }));
      caja.distribuir(garantiaPerdida({ monto: 300, asistentes: ["beto"] }));
      const creditosDeBeto = caja.creditosPendientesDe("beto");

      const reparto = caja.repartir("beto", dia(5));

      expect(reparto.acreedor()).toBe("beto");
      expect(reparto.fecha()).toEqual(dia(5));
      expect(reparto.monto()).toBe(800);
      expect(reparto.creditos()).toEqual(creditosDeBeto);
      expect(caja.creditosPendientesDe("beto")).toEqual([]);
      expect(caja.montoPendienteDe("carla")).toBe(500);
      expect(caja.repartos()).toEqual([reparto]);
    });

    it("no se puede repartir a quien no tiene créditos pendientes", () => {
      const caja = nuevaCaja();

      expect(() => {
        caja.repartir("beto", dia(5));
      }).toThrow("beto no tiene créditos pendientes");
      expect(caja.repartos()).toEqual([]);
    });
  });

  describe("movimientos", () => {
    it("los movimientos son los cobros y los repartos, en orden cronológico, sin las garantías perdidas", () => {
      const caja = nuevaCaja();
      caja.cobrar(new Cobro("ana", 1000, dia(1)));
      caja.distribuir(garantiaPerdida({ persona: "ana", monto: 1000, numero: 3, asistentes: ["beto"] }));
      caja.repartir("beto", dia(5));
      caja.cobrar(new Cobro("dario", 300, dia(6)));

      const movimientos = caja.movimientos();

      expect(
        movimientos.map((movimiento) => [
          movimiento.fecha(),
          movimiento.tipo(),
          movimiento.persona(),
          movimiento.monto(),
        ]),
      ).toEqual([
        [dia(1), "cobro", "ana", 1000],
        [dia(5), "reparto", "beto", 1000],
        [dia(6), "cobro", "dario", 300],
      ]);
    });

    it("un cobro no genera créditos", () => {
      const caja = nuevaCaja();

      caja.cobrar(new Cobro("ana", 1000, dia(1)));

      expect(caja.totalPendiente()).toBe(0);
    });
  });
});
