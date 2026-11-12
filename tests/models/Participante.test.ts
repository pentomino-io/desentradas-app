import { describe, expect, it } from "vitest";
import { TransicionInvalida } from "../../src/models/estados/TransicionInvalida.ts";
import { dia, nuevoEncuentro, nuevoParticipante, reglas } from "./factories.ts";

const lasReglas = reglas({ toleranciaDeFaltas: 2 });

const enDeuda = (encuentro = nuevoEncuentro(), reglasDeIngreso = lasReglas) => {
  const ana = nuevoParticipante(reglasDeIngreso);
  ana.falto(encuentro);
  return ana;
};

const libreDeDeuda = () => {
  const ana = enDeuda();
  ana.pago(dia(3), ana.deudaAl(dia(3)), "efectivo");
  return ana;
};

const finalizadoPorFaltas = () => {
  const ana = libreDeDeuda();
  ana.falto(nuevoEncuentro({ numero: 9 }));
  ana.falto(nuevoEncuentro({ numero: 16 }));
  return ana;
};

const moroso = (encuentroQueOriginoLaDeuda = nuevoEncuentro(), reglasDeIngreso = lasReglas) => {
  const ana = enDeuda(encuentroQueOriginoLaDeuda, reglasDeIngreso);
  ana.falto(nuevoEncuentro({ numero: 9 }));
  return ana;
};

const finalizado = (fecha = dia(16)) => {
  const ana = moroso();
  ana.pago(fecha, ana.deudaAl(fecha), "efectivo");
  return ana;
};

describe("Participante", () => {
  describe("participando", () => {
    it("al ingresar está participando, sin faltas ni deuda", () => {
      const ana = nuevoParticipante();

      expect(ana.nombre()).toBe("ana");
      expect(ana.estado()).toBe("participando");
      expect(ana.estaActivo()).toBe(true);
      expect(ana.faltas()).toBe(0);
      expect(ana.deudaAl(dia(2))).toBe(0);
    });

    it("se rige por las reglas con que ingresó", () => {
      const reglasDeIngreso = reglas();

      const ana = nuevoParticipante(reglasDeIngreso);

      expect(ana.reglas()).toBe(reglasDeIngreso);
    });

    it("está habilitado para asistir", () => {
      const ana = nuevoParticipante();

      expect(ana.puedeAsistir()).toBe(true);
    });

    it("es un posible asistente, porque ya está habilitado", () => {
      const ana = nuevoParticipante();

      expect(ana.esPosibleAsistente()).toBe(true);
    });

    it("está al día", () => {
      const ana = nuevoParticipante();

      expect(ana.estaAlDia()).toBe(true);
    });

    it("no tiene nada que pagar para asistir", () => {
      const ana = nuevoParticipante();

      expect(ana.soloLeFaltaPagarParaAsistir()).toBe(false);
    });

    it("ir a un encuentro lo mantiene participando", () => {
      const ana = nuevoParticipante();

      ana.voy(nuevoEncuentro(), lasReglas);

      expect(ana.estado()).toBe("participando");
    });

    it("ir a un encuentro lo pasa a regirse por las reglas con que fue", () => {
      const ana = nuevoParticipante();
      const reglasDelEncuentro = reglas({ rigeDesde: dia(2) });

      ana.voy(nuevoEncuentro({ numero: 2 }), reglasDelEncuentro);

      expect(ana.reglas()).toBe(reglasDelEncuentro);
    });

    it("faltar lo deja en deuda por el monto por falta de sus reglas", () => {
      const ana = nuevoParticipante(reglas({ garantia: 1500 }));

      ana.falto(nuevoEncuentro());

      expect(ana.estado()).toBe("en deuda");
      expect(ana.deudaAl(dia(3))).toBe(1500);
    });

    it("faltar cuenta la falta", () => {
      const ana = nuevoParticipante();

      ana.falto(nuevoEncuentro());

      expect(ana.faltas()).toBe(1);
    });

    it("sus acciones posibles son ir y faltar", () => {
      const ana = nuevoParticipante();

      expect(ana.accionesPosibles()).toEqual(["voy", "falto"]);
      expect(ana.puede("voy")).toBe(true);
      expect(ana.puede("pago")).toBe(false);
    });

    it("no puede pagar porque no debe nada", () => {
      const ana = nuevoParticipante();

      expect(() => {
        ana.pago(dia(2), 1000, "efectivo");
      }).toThrow(TransicionInvalida);
    });

    it("no puede reingresar", () => {
      const ana = nuevoParticipante();

      expect(() => {
        ana.reingresar(dia(20), lasReglas);
      }).toThrow(TransicionInvalida);
    });
  });

  describe("en deuda", () => {
    it("sus acciones posibles son faltar y pagar", () => {
      const ana = enDeuda();

      expect(ana.accionesPosibles()).toEqual(["falto", "pago"]);
    });

    it("es un posible asistente, porque puede asistir si paga", () => {
      const ana = enDeuda();

      expect(ana.esPosibleAsistente()).toBe(true);
    });

    it("no está habilitado para asistir", () => {
      const ana = enDeuda();

      expect(ana.puedeAsistir()).toBe(false);
    });

    it("sólo le falta pagar para asistir", () => {
      const ana = enDeuda();

      expect(ana.soloLeFaltaPagarParaAsistir()).toBe(true);
    });

    it("no está al día", () => {
      const ana = enDeuda();

      expect(ana.estaAlDia()).toBe(false);
    });

    it("no puede ir a un encuentro", () => {
      const ana = enDeuda();

      expect(() => {
        ana.voy(nuevoEncuentro(), lasReglas);
      }).toThrow(TransicionInvalida);
    });

    it("pagar el total lo deja libre de deuda", () => {
      const ana = enDeuda();

      ana.pago(dia(3), 1000, "efectivo");

      expect(ana.estado()).toBe("libre de deuda");
      expect(ana.deudaAl(dia(4))).toBe(0);
    });

    it("pagar no cambia las reglas por las que se rige", () => {
      const reglasDeIngreso = reglas();
      const ana = enDeuda(nuevoEncuentro(), reglasDeIngreso);

      ana.pago(dia(3), 1000, "efectivo");

      expect(ana.reglas()).toBe(reglasDeIngreso);
    });

    it("pagar produce un cobro a su nombre por el encuentro adeudado", () => {
      const encuentro = nuevoEncuentro();
      const ana = enDeuda(encuentro);

      const cobro = ana.pago(dia(3), 400, "efectivo");

      expect(cobro.deudor()).toBe("ana");
      expect(cobro.monto()).toBe(400);
      expect(cobro.fecha()).toEqual(dia(3));
      expect(cobro.encuentroFaltado()).toBe(encuentro);
      expect(cobro.origen()).toBe("efectivo");
    });

    it("pagar conserva la falta que originó la deuda", () => {
      const ana = enDeuda();

      ana.pago(dia(3), 1000, "efectivo");

      expect(ana.faltas()).toBe(1);
    });

    it("un pago parcial lo deja en deuda por el resto", () => {
      const ana = enDeuda();

      ana.pago(dia(3), 400, "efectivo");

      expect(ana.estado()).toBe("en deuda");
      expect(ana.deudaAl(dia(4))).toBe(600);
    });

    it("no se puede pagar más de lo que debe", () => {
      const ana = enDeuda();

      expect(() => {
        ana.pago(dia(3), 1001, "efectivo");
      }).toThrow("El pago no puede superar la deuda");
      expect(ana.estado()).toBe("en deuda");
      expect(ana.historial()).toHaveLength(2);
    });

    it("faltar lo vuelve moroso", () => {
      const ana = enDeuda();

      ana.falto(nuevoEncuentro({ numero: 9 }));

      expect(ana.estado()).toBe("moroso");
    });

    it("al volverse moroso conserva las faltas y la deuda que tenía", () => {
      const ana = enDeuda();

      ana.falto(nuevoEncuentro({ numero: 9 }));

      expect(ana.faltas()).toBe(1);
      expect(ana.deudaAl(dia(10))).toBe(1000);
    });

    it("no puede reingresar", () => {
      const ana = enDeuda();

      expect(() => {
        ana.reingresar(dia(20), lasReglas);
      }).toThrow(TransicionInvalida);
    });

    it("puede pagar en la puerta y asistir al mismo encuentro", () => {
      const ana = enDeuda();
      const siguienteEncuentro = nuevoEncuentro({ asistentes: ["ana"] });

      ana.pago(siguienteEncuentro.fecha(), 1000, "efectivo");
      ana.voy(siguienteEncuentro, lasReglas);

      expect(ana.estado()).toBe("participando");
      expect(ana.faltas()).toBe(0);
      expect(ana.deudaAl(dia(10))).toBe(0);
    });
  });

  describe("libre de deuda", () => {
    it("está habilitado para asistir", () => {
      const ana = libreDeDeuda();

      expect(ana.puedeAsistir()).toBe(true);
    });

    it("no tiene nada que pagar para asistir", () => {
      const ana = libreDeDeuda();

      expect(ana.soloLeFaltaPagarParaAsistir()).toBe(false);
    });

    it("no está al día, porque se le cuentan las faltas", () => {
      const ana = libreDeDeuda();

      expect(ana.estaAlDia()).toBe(false);
    });

    it("sus acciones posibles son ir y faltar", () => {
      const ana = libreDeDeuda();

      expect(ana.accionesPosibles()).toEqual(["voy", "falto"]);
    });

    it("no puede pagar porque no debe nada", () => {
      const ana = libreDeDeuda();

      expect(() => {
        ana.pago(dia(4), 1000, "efectivo");
      }).toThrow(TransicionInvalida);
    });

    it("no puede reingresar", () => {
      const ana = libreDeDeuda();

      expect(() => {
        ana.reingresar(dia(20), lasReglas);
      }).toThrow(TransicionInvalida);
    });

    it("cada falta se cuenta sin generar deuda", () => {
      const ana = libreDeDeuda();

      ana.falto(nuevoEncuentro());

      expect(ana.faltas()).toBe(2);
      expect(ana.deudaAl(dia(10))).toBe(0);
    });

    it("sigue libre de deuda mientras las faltas no superen la tolerancia", () => {
      const ana = libreDeDeuda();

      ana.falto(nuevoEncuentro());

      expect(ana.estado()).toBe("libre de deuda");
      expect(ana.estaActivo()).toBe(true);
    });

    it("volver a ir borra las faltas y lo devuelve a participando", () => {
      const ana = libreDeDeuda();
      ana.falto(nuevoEncuentro());

      ana.voy(nuevoEncuentro(), lasReglas);

      expect(ana.estado()).toBe("participando");
      expect(ana.faltas()).toBe(0);
    });

    it("volver a ir lo pasa a regirse por las reglas con que fue", () => {
      const ana = libreDeDeuda();
      const reglasDelEncuentro = reglas({ rigeDesde: dia(2) });

      ana.voy(nuevoEncuentro({ numero: 9 }), reglasDelEncuentro);

      expect(ana.reglas()).toBe(reglasDelEncuentro);
    });

    it("la falta que supera la tolerancia desde la última vez que fue lo finaliza por faltas, sin deber nada", () => {
      const ana = nuevoParticipante();
      ana.voy(nuevoEncuentro({ numero: 2 }), lasReglas);
      ana.falto(nuevoEncuentro({ numero: 9 }));
      ana.pago(dia(10), 1000, "efectivo");
      ana.falto(nuevoEncuentro({ numero: 16 })); // ana llega a las dos faltas toleradas

      ana.falto(nuevoEncuentro({ numero: 23 }));

      expect(ana.estado()).toBe("finalizado");
      expect(ana.motivoDeFinalizacion()).toBe("por faltas");
      expect(ana.deudaAl(dia(17))).toBe(0);
    });

    it("la tolerancia de faltas es la de sus reglas", () => {
      const ana = nuevoParticipante(reglas({ toleranciaDeFaltas: 1 }));
      ana.falto(nuevoEncuentro({ numero: 2 }));
      ana.pago(dia(3), 1000, "efectivo");

      ana.falto(nuevoEncuentro({ numero: 9 }));

      expect(ana.motivoDeFinalizacion()).toBe("por faltas");
    });
  });

  describe("moroso", () => {
    it("pagar produce un cobro por el encuentro que originó la deuda", () => {
      const encuentro = nuevoEncuentro({ numero: 2 });
      const ana = moroso(encuentro);

      const cobro = ana.pago(dia(20), 400, "efectivo");

      expect(cobro.encuentroFaltado()).toBe(encuentro);
    });

    it("su única acción posible es pagar", () => {
      const ana = moroso();

      expect(ana.accionesPosibles()).toEqual(["pago"]);
    });

    it("sigue activo", () => {
      const ana = moroso();

      expect(ana.estaActivo()).toBe(true);
    });

    it("no está habilitado para asistir", () => {
      const ana = moroso();

      expect(ana.puedeAsistir()).toBe(false);
    });

    it("no es un posible asistente, porque no puede asistir ni pagando", () => {
      const ana = moroso();

      expect(ana.esPosibleAsistente()).toBe(false);
    });

    it("pagar no le alcanza para asistir", () => {
      const ana = moroso();

      expect(ana.soloLeFaltaPagarParaAsistir()).toBe(false);
    });

    it("sólo le falta pagar para reingresar", () => {
      const ana = moroso();

      expect(ana.soloLeFaltaPagarParaReingresar()).toBe(true);
    });

    it("no está al día", () => {
      const ana = moroso();

      expect(ana.estaAlDia()).toBe(false);
    });

    it("no puede ir a un encuentro", () => {
      const ana = moroso();

      expect(() => {
        ana.voy(nuevoEncuentro(), lasReglas);
      }).toThrow(TransicionInvalida);
    });

    it("no puede reingresar", () => {
      const ana = moroso();

      expect(() => {
        ana.reingresar(dia(20), lasReglas);
      }).toThrow(TransicionInvalida);
    });

    it("no puede faltar a un encuentro", () => {
      const ana = moroso();

      expect(() => {
        ana.falto(nuevoEncuentro({ numero: 16 }));
      }).toThrow(TransicionInvalida);
    });

    it("un pago parcial lo mantiene moroso por el resto", () => {
      const ana = moroso();

      ana.pago(dia(16), 400, "efectivo");

      expect(ana.estado()).toBe("moroso");
      expect(ana.deudaAl(dia(17))).toBe(600);
    });

    it("saldar la deuda finaliza la participación por pago de morosidad", () => {
      const ana = moroso();

      ana.pago(dia(16), 1000, "efectivo");

      expect(ana.estado()).toBe("finalizado");
      expect(ana.motivoDeFinalizacion()).toBe("por pago de morosidad");
      expect(ana.deudaAl(dia(17))).toBe(0);
    });
  });

  describe("finalizado", () => {
    it("su única acción posible es reingresar", () => {
      const ana = finalizado();

      expect(ana.accionesPosibles()).toEqual(["reingresar"]);
      expect(ana.puede("reingresar")).toBe(true);
    });

    it("ya no está activo", () => {
      const ana = finalizado();

      expect(ana.estaActivo()).toBe(false);
    });

    it("no está habilitado para asistir", () => {
      const ana = finalizado();

      expect(ana.puedeAsistir()).toBe(false);
    });

    it("reingresar lo devuelve a participando", () => {
      const ana = finalizado();

      ana.reingresar(dia(20), lasReglas);

      expect(ana.estado()).toBe("participando");
      expect(ana.faltas()).toBe(0);
      expect(ana.deudaAl(dia(21))).toBe(0);
      expect(ana.motivoDeFinalizacion()).toBeUndefined();
    });

    it("al reingresar se rige por las reglas con que reingresó", () => {
      const ana = finalizado();
      const reglasDelReingreso = reglas({ rigeDesde: dia(18) });

      ana.reingresar(dia(20), reglasDelReingreso);

      expect(ana.reglas()).toBe(reglasDelReingreso);
    });

    it("no se rige por ninguna regla", () => {
      const ana = finalizado();

      expect(() => {
        ana.reglas();
      }).toThrow("Un participante finalizado no se rige por ninguna regla");
    });

    it("no se puede reingresar en una fecha anterior a la finalización", () => {
      const ana = finalizado();

      expect(() => {
        ana.reingresar(dia(15), lasReglas);
      }).toThrow("El reingreso no puede ser anterior a la finalización");
      expect(ana.estado()).toBe("finalizado");
    });

    it("se puede reingresar el mismo día de la finalización", () => {
      const ana = finalizado();

      ana.reingresar(dia(16), lasReglas);

      expect(ana.estado()).toBe("participando");
    });

    it("reingresar después de finalizar por faltas también lo devuelve a participando", () => {
      const ana = finalizadoPorFaltas();

      ana.reingresar(dia(20), lasReglas);

      expect(ana.estado()).toBe("participando");
      expect(ana.faltas()).toBe(0);
      expect(ana.motivoDeFinalizacion()).toBeUndefined();
    });

    it("pagar no le alcanza para asistir", () => {
      const ana = finalizado();

      expect(ana.soloLeFaltaPagarParaAsistir()).toBe(false);
    });

    it("no tiene nada que pagar para reingresar", () => {
      const ana = finalizado();

      expect(ana.soloLeFaltaPagarParaReingresar()).toBe(false);
    });

    it("no está al día", () => {
      const ana = finalizado();

      expect(ana.estaAlDia()).toBe(false);
    });

    it("no es un posible asistente", () => {
      const ana = finalizado();

      expect(ana.esPosibleAsistente()).toBe(false);
    });

    it("no puede ir a un encuentro", () => {
      const ana = finalizado();

      expect(() => {
        ana.voy(nuevoEncuentro(), lasReglas);
      }).toThrow(TransicionInvalida);
    });

    it("no puede faltar a un encuentro", () => {
      const ana = finalizado();

      expect(() => {
        ana.falto(nuevoEncuentro());
      }).toThrow(TransicionInvalida);
    });

    it("no puede pagar", () => {
      const ana = finalizado();

      expect(() => {
        ana.pago(dia(23), 1000, "efectivo");
      }).toThrow(TransicionInvalida);
    });
  });

  describe("historial", () => {
    it("registra el ingreso y cada cambio de estado, con su fecha, qué lo provocó y a qué estado llevó", () => {
      const ana = nuevoParticipante();
      ana.voy(nuevoEncuentro({ numero: 2 }), lasReglas);
      ana.falto(nuevoEncuentro({ numero: 9 }));
      ana.pago(dia(10), 1000, "efectivo");

      const historial = ana.historial();

      expect(historial.map((transicion) => [transicion.fecha(), transicion.disparador(), transicion.estado()])).toEqual(
        [
          [dia(1), "ingreso", "participando"],
          [dia(2), "voy", "participando"],
          [dia(9), "falto", "en deuda"],
          [dia(10), "pago", "libre de deuda"],
        ],
      );
    });

    it("la fecha del último cambio es la de la última transición del historial", () => {
      const ana = nuevoParticipante();
      ana.voy(nuevoEncuentro({ numero: 2 }), lasReglas);
      ana.falto(nuevoEncuentro({ numero: 9 }));

      ana.pago(dia(10), 1000, "efectivo");

      expect(ana.fechaDelUltimoCambio()).toEqual(dia(10));
    });

    it("la fecha de ingreso es la del ingreso, aunque después haya otros cambios", () => {
      const ana = nuevoParticipante();

      ana.voy(nuevoEncuentro({ numero: 2 }), lasReglas);

      expect(ana.fechaDeIngreso()).toEqual(dia(1));
    });

    it("después de un reingreso, la fecha de ingreso es la del reingreso", () => {
      const ana = finalizado();

      ana.reingresar(dia(20), lasReglas);

      expect(ana.fechaDeIngreso()).toEqual(dia(20));
    });

    it("el reingreso continúa el historial de la misma participación", () => {
      const ana = finalizado();
      const transicionesAlFinalizar = ana.historial().length;

      ana.reingresar(dia(20), lasReglas);

      const ultima = ana.historial().at(-1)!;
      expect(ana.historial()).toHaveLength(transicionesAlFinalizar + 1);
      expect([ultima.fecha(), ultima.disparador(), ultima.estado()]).toEqual([dia(20), "reingresar", "participando"]);
    });

    it("un pago parcial queda en el historial aunque el estado no cambie", () => {
      const ana = enDeuda();

      ana.pago(dia(3), 400, "efectivo");

      const ultima = ana.historial().at(-1)!;
      expect([ultima.fecha(), ultima.disparador(), ultima.estado()]).toEqual([dia(3), "pago", "en deuda"]);
    });

    it("una acción rechazada no deja rastro en el historial", () => {
      const ana = nuevoParticipante();

      expect(() => {
        ana.pago(dia(2), 1000, "efectivo");
      }).toThrow(TransicionInvalida);

      expect(ana.historial()).toHaveLength(1);
    });
  });
});
