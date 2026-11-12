import { describe, expect, it } from "vitest";
import { Deuda } from "../../src/models/Deuda.ts";
import { dia, nuevoEncuentro } from "./factories.ts";

const montoPorFalta = 1000;

const nuevaDeuda = (encuentro = nuevoEncuentro()) => new Deuda(montoPorFalta, encuentro);

describe("Deuda", () => {
  it("se origina por faltar a un encuentro, por un monto", () => {
    const encuentro = nuevoEncuentro();
    const deuda = nuevaDeuda(encuentro);

    expect(deuda.monto()).toBe(montoPorFalta);
    expect(deuda.encuentroFaltado()).toBe(encuentro);
  });

  describe("pagos", () => {
    it("un pago parcial reduce la deuda por el monto pagado", () => {
      const deuda = nuevaDeuda();

      deuda.pagar(dia(3), 400);

      expect(deuda.estaSaldada()).toBe(false);
      expect(deuda.monto()).toBe(600);
    });

    it("pagar el total la salda", () => {
      const deuda = nuevaDeuda();

      deuda.pagar(dia(3), montoPorFalta);

      expect(deuda.estaSaldada()).toBe(true);
      expect(deuda.monto()).toBe(0);
    });

    it("no se puede pagar más de lo que vale la deuda", () => {
      const deuda = nuevaDeuda();

      expect(() => {
        deuda.pagar(dia(3), montoPorFalta + 1);
      }).toThrow("El pago no puede superar la deuda");
      expect(deuda.monto()).toBe(montoPorFalta);
    });

    it("el monto de un pago debe ser positivo", () => {
      const deuda = nuevaDeuda();

      expect(() => {
        deuda.pagar(dia(3), 0);
      }).toThrow("El monto del pago debe ser positivo");
      expect(() => {
        deuda.pagar(dia(3), -100);
      }).toThrow("El monto del pago debe ser positivo");
      expect(deuda.monto()).toBe(montoPorFalta);
    });

    it("no se puede pagar en una fecha anterior al encuentro faltado", () => {
      const deuda = nuevaDeuda(nuevoEncuentro({ numero: 9 }));

      expect(() => {
        deuda.pagar(dia(8), 100);
      }).toThrow("El cobro no puede ser anterior al encuentro faltado");
    });
  });
});
