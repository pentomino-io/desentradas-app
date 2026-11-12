import { describe, expect, it } from "vitest";
import { TransicionInvalida } from "../../src/models/estados/TransicionInvalida.ts";
import { dia, nuevoEncuentro, nuevoParticipante } from "./factories.ts";

const inactivo = () => {
  const ana = nuevoParticipante();
  ana.falto(nuevoEncuentro({ numero: 2 }));
  return ana;
};

describe("Participante", () => {
  describe("participando", () => {
    it("al ingresar está participando con la garantía que pagó, sin faltas", () => {
      const ana = nuevoParticipante(1500);

      expect(ana.nombre()).toBe("ana");
      expect(ana.estado()).toBe("participando");
      expect(ana.garantia()).toBe(1500);
      expect(ana.faltas()).toBe(0);
      expect(ana.puedeAsistir()).toBe(true);
    });

    it("ir a un encuentro lo mantiene participando con la misma garantía", () => {
      const ana = nuevoParticipante(1500);

      ana.voy(nuevoEncuentro({ numero: 2 }));

      expect(ana.estado()).toBe("participando");
      expect(ana.garantia()).toBe(1500);
    });

    it("faltar le hace perder la garantía por ese encuentro y lo deja inactivo con una falta", () => {
      const ana = nuevoParticipante(1500);
      const encuentro = nuevoEncuentro({ numero: 2 });

      const perdida = ana.falto(encuentro);

      expect(perdida?.persona()).toBe("ana");
      expect(perdida?.monto()).toBe(1500);
      expect(perdida?.encuentroFaltado()).toBe(encuentro);
      expect(ana.estado()).toBe("inactivo");
      expect(ana.garantia()).toBe(0);
      expect(ana.faltas()).toBe(1);
    });

    it("no se le puede cobrar la garantía", () => {
      const ana = nuevoParticipante();

      expect(() => {
        ana.cobrarGarantia(dia(2), 1000);
      }).toThrow(TransicionInvalida);
      expect(ana.historial()).toHaveLength(1);
    });
  });

  describe("inactivo", () => {
    it("no está habilitado para asistir", () => {
      const ana = inactivo();

      expect(ana.puedeAsistir()).toBe(false);
    });

    it("no puede ir a un encuentro", () => {
      const ana = inactivo();

      expect(() => {
        ana.voy(nuevoEncuentro({ numero: 9 }));
      }).toThrow(TransicionInvalida);
    });

    it("faltar suma una falta más sin perder nada", () => {
      const ana = inactivo();

      const perdida = ana.falto(nuevoEncuentro({ numero: 9 }));

      expect(perdida).toBeUndefined();
      expect(ana.estado()).toBe("inactivo");
      expect(ana.faltas()).toBe(2);
    });

    it("cobrarle la garantía lo devuelve a participando con esa garantía y sin faltas", () => {
      const ana = inactivo();

      ana.cobrarGarantia(dia(3), 2000);

      expect(ana.estado()).toBe("participando");
      expect(ana.garantia()).toBe(2000);
      expect(ana.faltas()).toBe(0);
    });
  });

  describe("historial", () => {
    it("registra el ingreso y cada cambio de estado, con su fecha, qué lo provocó y a qué estado llevó", () => {
      const ana = nuevoParticipante();
      ana.voy(nuevoEncuentro({ numero: 2 }));
      ana.falto(nuevoEncuentro({ numero: 9 }));
      ana.cobrarGarantia(dia(10), 1000);

      const historial = ana.historial();

      expect(historial.map((transicion) => [transicion.fecha(), transicion.disparador(), transicion.estado()])).toEqual(
        [
          [dia(1), "ingreso", "participando"],
          [dia(2), "voy", "participando"],
          [dia(9), "falto", "inactivo"],
          [dia(10), "cobro de garantía", "participando"],
        ],
      );
    });

    it("la fecha del último cambio es la de la última transición del historial", () => {
      const ana = nuevoParticipante();
      ana.voy(nuevoEncuentro({ numero: 2 }));

      ana.falto(nuevoEncuentro({ numero: 9 }));

      expect(ana.fechaDelUltimoCambio()).toEqual(dia(9));
    });
  });
});
