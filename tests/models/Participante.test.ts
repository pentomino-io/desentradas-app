import { describe, expect, it } from "vitest";
import { TransicionInvalida } from "../../src/models/estados/TransicionInvalida.ts";
import { Participante } from "../../src/models/Participante.ts";
import { dia, nuevoEncuentro, nuevoParticipante } from "./factories.ts";

const inactivo = () => {
  const ana = nuevoParticipante();
  ana.falto(nuevoEncuentro({ numero: 2 }));
  return ana;
};

describe("Participante", () => {
  describe("ingreso", () => {
    it("al ingresar está inactivo sin faltas ni garantía, y no puede asistir", () => {
      const ana = new Participante("ana", dia(1));

      expect(ana.nombre()).toBe("ana");
      expect(ana.estado()).toBe("inactivo");
      expect(ana.faltas()).toBe(0);
      expect(ana.garantia()).toBe(0);
      expect(ana.puedeAsistir(1500)).toBe(false);
    });

    it("cobrarle la garantía después de ingresar lo deja participando con esa garantía, sin faltas", () => {
      const ana = new Participante("ana", dia(1));

      ana.cobrarGarantia(dia(2), 1500);

      expect(ana.estado()).toBe("participando");
      expect(ana.garantia()).toBe(1500);
      expect(ana.faltas()).toBe(0);
      expect(ana.puedeAsistir(1500)).toBe(true);
    });

    it("quien todavía no faltó ni se le cobró la garantía desde que ingresó está recién ingresado", () => {
      const ana = new Participante("ana", dia(1));

      const recien = ana.recienIngresado();

      expect(recien).toBe(true);
    });

    it.each([
      { caso: "faltó", despues: (ana: Participante) => ana.falto(nuevoEncuentro({ numero: 2 })) },
      { caso: "se le cobró la garantía", despues: (ana: Participante) => ana.cobrarGarantia(dia(2), 1000) },
    ])("quien ingresó y después $caso ya no está recién ingresado", ({ despues }) => {
      const ana = new Participante("ana", dia(1));
      despues(ana);

      const recien = ana.recienIngresado();

      expect(recien).toBe(false);
    });
  });

  describe("participando", () => {
    it("con la garantía incompleta no puede asistir", () => {
      const ana = nuevoParticipante(1000);

      const puedeAsistir = ana.puedeAsistir(1500);

      expect(puedeAsistir).toBe(false);
    });

    it("con una garantía menor a la desentrada está en situación de garantía incompleta", () => {
      const ana = nuevoParticipante(1000);

      const situacion = ana.situacion(1500);

      expect(situacion).toBe("garantía incompleta");
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

      const desentrada = ana.falto(encuentro);

      expect(desentrada.persona()).toBe("ana");
      expect(desentrada.monto()).toBe(1500);
      expect(desentrada.encuentroFaltado()).toBe(encuentro);
      expect(ana.estado()).toBe("inactivo");
      expect(ana.garantia()).toBe(0);
      expect(ana.faltas()).toBe(1);
    });

    it("bajarle la garantía lo deja participando con la nueva y devuelve el excedente", () => {
      const ana = nuevoParticipante(1500);

      const excedente = ana.bajarGarantia(dia(2), 1000);

      expect(excedente).toBe(500);
      expect(ana.estado()).toBe("participando");
      expect(ana.garantia()).toBe(1000);
      expect(ana.historial().at(-1)?.disparador()).toBe("cambio de reglas");
    });

    it("bajarle la garantía a un monto mayor que el que tiene no la cambia", () => {
      const ana = nuevoParticipante(1000);

      const excedente = ana.bajarGarantia(dia(2), 1500);

      expect(excedente).toBe(0);
      expect(ana.garantia()).toBe(1000);
      expect(ana.historial()).toHaveLength(2);
    });

    it("con la garantía incompleta, le falta cobrar la diferencia con la desentrada", () => {
      const ana = nuevoParticipante(1000);

      const porCobrar = ana.garantiaPorCobrar(1500);

      expect(porCobrar).toBe(500);
    });

    it("con la garantía completa, no le falta cobrar nada", () => {
      const ana = nuevoParticipante(1000);

      const porCobrar = ana.garantiaPorCobrar(1000);

      expect(porCobrar).toBe(0);
    });

    it("con la garantía incompleta, cobrarle la garantía se la completa y puede asistir", () => {
      const ana = nuevoParticipante(1000);

      ana.cobrarGarantia(dia(2), 1500);

      expect(ana.estado()).toBe("participando");
      expect(ana.garantia()).toBe(1500);
      expect(ana.puedeAsistir(1500)).toBe(true);
    });

    it("con la garantía completa no se le puede cobrar la garantía", () => {
      const ana = nuevoParticipante(1000);

      expect(() => {
        ana.cobrarGarantia(dia(2), 1000);
      }).toThrow(TransicionInvalida);
      expect(ana.historial()).toHaveLength(2);
    });
  });

  describe("inactivo", () => {
    it("no puede asistir", () => {
      const ana = inactivo();

      expect(ana.puedeAsistir(1000)).toBe(false);
    });

    it("no puede ir a un encuentro", () => {
      const ana = inactivo();

      expect(() => {
        ana.voy(nuevoEncuentro({ numero: 9 }));
      }).toThrow(TransicionInvalida);
    });

    it("faltar suma una falta más sin perder nada", () => {
      const ana = inactivo();

      const desentrada = ana.falto(nuevoEncuentro({ numero: 9 }));

      expect(desentrada.monto()).toBe(0);
      expect(ana.estado()).toBe("inactivo");
      expect(ana.faltas()).toBe(2);
    });

    it("a quien no tiene garantía le falta cobrar toda la desentrada", () => {
      const ana = inactivo();

      const porCobrar = ana.garantiaPorCobrar(1500);

      expect(porCobrar).toBe(1500);
    });

    it("bajarle la garantía no le devuelve nada, porque no tiene garantía", () => {
      const ana = inactivo();

      const excedente = ana.bajarGarantia(dia(3), 500);

      expect(excedente).toBe(0);
      expect(ana.historial()).toHaveLength(3);
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
          [dia(1), "ingreso", "inactivo"],
          [dia(1), "cobro de garantía", "participando"],
          [dia(2), "voy", "participando"],
          [dia(9), "falto", "inactivo"],
          [dia(10), "cobro de garantía", "participando"],
        ],
      );
    });

    it("la fecha del último cambio es la del cambio de estado más reciente", () => {
      const ana = nuevoParticipante();
      ana.voy(nuevoEncuentro({ numero: 2 }));

      ana.falto(nuevoEncuentro({ numero: 9 }));

      expect(ana.fechaDelUltimoCambio()).toEqual(dia(9));
    });
  });
});
