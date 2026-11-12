import { describe, expect, it } from "vitest";
import { TransicionInvalida } from "../../src/models/estados/TransicionInvalida.ts";
import { Grupo } from "../../src/models/Grupo.ts";
import { desempate, dia, nuevoEncuentro, nuevoGrupo, reglas } from "./factories.ts";

const grupoConAnaInactiva = () => {
  const grupo = nuevoGrupo();
  const ana = grupo.ingresar("ana", dia(1));
  const beto = grupo.ingresar("beto", dia(1));
  grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));
  return { grupo, ana, beto };
};

const movimientosDe = (grupo: Grupo) =>
  grupo
    .caja()
    .movimientos()
    .map((movimiento) => [movimiento.fecha(), movimiento.tipo(), movimiento.persona(), movimiento.monto()]);

describe("Grupo", () => {
  describe("nombre", () => {
    it("se crea con su nombre", () => {
      const grupo = new Grupo("Fútbol de los jueves", reglas(), desempate);

      const nombre = grupo.nombre();

      expect(nombre).toBe("Fútbol de los jueves");
    });

    it("se guarda sin espacios al principio ni al final", () => {
      const grupo = new Grupo("  Fútbol de los jueves ", reglas(), desempate);

      const nombre = grupo.nombre();

      expect(nombre).toBe("Fútbol de los jueves");
    });

    it("no puede estar vacío", () => {
      expect(() => {
        new Grupo("   ", reglas(), desempate);
      }).toThrow("El nombre del grupo no puede estar vacío");
    });
  });

  describe("reglas", () => {
    it("se crea con sus reglas iniciales, que son la única versión del historial", () => {
      const reglasIniciales = reglas();

      const grupo = nuevoGrupo(reglasIniciales);

      expect(grupo.reglas()).toBe(reglasIniciales);
      expect(grupo.historialDeReglas()).toEqual([reglasIniciales]);
    });

    it("cambiar las reglas después de un encuentro agrega una versión al historial", () => {
      const reglasIniciales = reglas();
      const grupo = nuevoGrupo(reglasIniciales);
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"] }));
      const nuevasReglas = reglas({ rigeDesde: dia(3) });

      grupo.cambiarReglas(nuevasReglas);

      expect(grupo.reglas()).toBe(nuevasReglas);
      expect(grupo.historialDeReglas()).toEqual([reglasIniciales, nuevasReglas]);
    });

    it("las reglas anteriores son todas las versiones salvo la vigente, de la más antigua a la más nueva", () => {
      const reglasIniciales = reglas();
      const grupo = nuevoGrupo(reglasIniciales);
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"] }));
      const segundasReglas = reglas({ rigeDesde: dia(3) });
      grupo.cambiarReglas(segundasReglas);
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 4, asistentes: ["beto"] }));

      grupo.cambiarReglas(reglas({ rigeDesde: dia(5) }));

      expect(grupo.reglasAnteriores()).toEqual([reglasIniciales, segundasReglas]);
    });

    it("cambiar las reglas siempre agrega una versión al historial, aunque las vigentes todavía no se hayan usado", () => {
      const reglasIniciales = reglas();
      const grupo = nuevoGrupo(reglasIniciales);
      const nuevasReglas = reglas({ rigeDesde: dia(4) });

      grupo.cambiarReglas(nuevasReglas);

      expect(grupo.historialDeReglas()).toEqual([reglasIniciales, nuevasReglas]);
    });

    it("no se pueden cambiar las reglas en una fecha anterior al último encuentro", () => {
      const reglasIniciales = reglas();
      const grupo = nuevoGrupo(reglasIniciales);
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["beto"] }));

      expect(() => {
        grupo.cambiarReglas(reglas({ rigeDesde: dia(8) }));
      }).toThrow("El cambio de reglas no puede ser anterior al último encuentro");
      expect(grupo.historialDeReglas()).toEqual([reglasIniciales]);
    });

    it("no se pueden cambiar las reglas en una fecha anterior a un ingreso", () => {
      const reglasIniciales = reglas();
      const grupo = nuevoGrupo(reglasIniciales);
      grupo.ingresar("ana", dia(5));

      expect(() => {
        grupo.cambiarReglas(reglas({ rigeDesde: dia(4) }));
      }).toThrow("El cambio de reglas no puede ser anterior al ingreso de ana");
      expect(grupo.historialDeReglas()).toEqual([reglasIniciales]);
    });

    it("no se pueden cambiar las reglas en una fecha anterior al último cambio de reglas", () => {
      const grupo = nuevoGrupo();
      grupo.cambiarReglas(reglas({ rigeDesde: dia(5) }));

      expect(() => {
        grupo.cambiarReglas(reglas({ rigeDesde: dia(4) }));
      }).toThrow("El cambio de reglas no puede ser anterior al último cambio de reglas");
      expect(grupo.historialDeReglas()).toHaveLength(2);
    });
  });

  describe("cambio de garantía", () => {
    it("bajar la garantía les devuelve el excedente como crédito pendiente a quienes participan, y nada a los inactivos", () => {
      const { grupo, ana, beto } = grupoConAnaInactiva(); // beto tiene $ 1.000 de crédito por la falta de ana

      grupo.cambiarReglas(reglas({ rigeDesde: dia(3), garantia: 600 }));

      expect(beto.garantia()).toBe(600);
      expect(grupo.caja().montoPendienteDe("beto")).toBe(1400);
      expect(ana.garantia()).toBe(0);
      expect(grupo.caja().montoPendienteDe("ana")).toBe(0);
    });
  });

  describe("efectos de cambiar las reglas", () => {
    const grupoConGarantiasDistintas = () => {
      const grupo = nuevoGrupo(reglas({ garantia: 1000 }));
      grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto", "carla"], ausentes: ["ana"] }));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(3), garantia: 1200 })); // beto y carla deben $ 200
      grupo.ingresar("dani", dia(3));
      return grupo;
    };

    it("son lo que pasa a deber quien queda con la garantía incompleta y el crédito que recibe quien tiene un excedente, sin nada para los inactivos", () => {
      const grupo = grupoConGarantiasDistintas();

      const efectos = grupo.efectosDeCambiarLasReglas(reglas({ rigeDesde: dia(4), garantia: 1100 }));

      expect(efectos.map((saldo) => [saldo.nombre(), saldo.monto()])).toEqual([
        ["beto", -100],
        ["carla", -100],
        ["dani", 100],
      ]);
    });

    it("no hay efectos si nadie pasa a deber otra cosa ni tiene un excedente", () => {
      const grupo = grupoConGarantiasDistintas();

      const efectos = grupo.efectosDeCambiarLasReglas(
        reglas({ rigeDesde: dia(4), garantia: 1200, toleranciaDeFaltas: 3 }),
      );

      expect(efectos).toEqual([]);
    });
  });

  describe("ingreso", () => {
    it("al ingresar, la persona queda como participante del grupo", () => {
      const grupo = nuevoGrupo();

      const ana = grupo.ingresar("ana", dia(1));

      expect(ana.estado()).toBe("participando");
      expect(grupo.participante("ana")).toBe(ana);
      expect(grupo.participantes()).toEqual([ana]);
    });

    it("ingresar cobra en efectivo la garantía de las reglas actuales", () => {
      const grupo = nuevoGrupo(reglas({ garantia: 1000 }));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(2), garantia: 1500 }));

      const ana = grupo.ingresar("ana", dia(3));

      expect(ana.garantia()).toBe(1500);
      expect(movimientosDe(grupo)).toEqual([[dia(3), "cobro", "ana", 1500]]);
    });

    it("no hay participante para quien no ingresó", () => {
      const grupo = nuevoGrupo();

      expect(grupo.participante("ana")).toBeUndefined();
    });

    it("una persona que ya está en el grupo no puede volver a ingresar", () => {
      const { grupo } = grupoConAnaInactiva();

      expect(() => {
        grupo.ingresar("ana", dia(3));
      }).toThrow("ana ya está en el grupo");
      expect(grupo.participantes()).toHaveLength(2);
      expect(grupo.caja().movimientos()).toHaveLength(2);
    });

    it("no se puede ingresar en una fecha anterior a otro ingreso", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("beto", dia(3));

      expect(() => {
        grupo.ingresar("ana", dia(2));
      }).toThrow("El ingreso no puede ser anterior al ingreso de beto");
      expect(grupo.participante("ana")).toBeUndefined();
    });

    it("no se puede ingresar en una fecha anterior al último encuentro", () => {
      const { grupo } = grupoConAnaInactiva();

      expect(() => {
        grupo.ingresar("carla", dia(1));
      }).toThrow("El ingreso no puede ser anterior al último encuentro");
      expect(grupo.participante("carla")).toBeUndefined();
      expect(grupo.caja().movimientos()).toHaveLength(2);
    });

    it("no se puede ingresar en una fecha anterior al último cambio de reglas, porque las reglas rigen desde que se cambian", () => {
      const grupo = nuevoGrupo();
      grupo.cambiarReglas(reglas({ rigeDesde: dia(5) }));

      expect(() => {
        grupo.ingresar("ana", dia(4));
      }).toThrow("El ingreso no puede ser anterior al último cambio de reglas");
      expect(grupo.participante("ana")).toBeUndefined();
    });

    it("no se puede ingresar en una fecha anterior a la creación del grupo", () => {
      const grupo = nuevoGrupo(reglas({ rigeDesde: dia(5) }));

      expect(() => {
        grupo.ingresar("ana", dia(4));
      }).toThrow("El ingreso no puede ser anterior a la creación del grupo");
    });

    it("el nombre de la persona se guarda sin espacios al principio ni al final", () => {
      const grupo = nuevoGrupo();

      const ana = grupo.ingresar("  ana ", dia(1));

      expect(ana.nombre()).toBe("ana");
      expect(grupo.participante("ana")).toBe(ana);
    });

    it("el nombre de la persona no puede estar vacío", () => {
      const grupo = nuevoGrupo();

      expect(() => {
        grupo.ingresar("   ", dia(1));
      }).toThrow("El nombre no puede estar vacío");
      expect(grupo.participantes()).toEqual([]);
    });

    it("los nombres distinguen mayúsculas de minúsculas", () => {
      const grupo = nuevoGrupo();

      const ana = grupo.ingresar("ana", dia(1));
      const anaConMayuscula = grupo.ingresar("Ana", dia(1));

      expect(grupo.participante("ana")).toBe(ana);
      expect(grupo.participante("Ana")).toBe(anaConMayuscula);
    });
  });

  describe("cobro de garantía", () => {
    it("cobrarle la garantía a un inactivo la cobra en efectivo según las reglas actuales y lo vuelve a hacer participar", () => {
      const { grupo, ana } = grupoConAnaInactiva();
      grupo.cambiarReglas(reglas({ rigeDesde: dia(3), garantia: 2000 }));

      grupo.cobrarGarantia("ana", dia(4));

      expect(ana.estado()).toBe("participando");
      expect(ana.garantia()).toBe(2000);
      expect(movimientosDe(grupo).at(-1)).toEqual([dia(4), "cobro", "ana", 2000]);
    });

    it("cobrarle la garantía a quien la tiene incompleta cobra en efectivo la diferencia y lo habilita para asistir", () => {
      const grupo = nuevoGrupo(reglas({ garantia: 1000 }));
      const ana = grupo.ingresar("ana", dia(1));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(2), garantia: 1500 }));

      grupo.cobrarGarantia("ana", dia(3));

      expect(ana.garantia()).toBe(1500);
      expect(grupo.puedeAsistir(ana)).toBe(true);
      expect(movimientosDe(grupo).at(-1)).toEqual([dia(3), "cobro", "ana", 500]);
    });

    it("la garantía por cobrar es lo que falta para llegar a la actual: toda para un inactivo, la diferencia para quien la tiene incompleta, nada para quien la tiene completa", () => {
      const grupo = nuevoGrupo(reglas({ garantia: 1000 }));
      const ana = grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(3), garantia: 1500 }));
      const carla = grupo.ingresar("carla", dia(3));

      const porCobrar = [ana, beto, carla].map((participante) => grupo.garantiaPorCobrarA(participante));

      expect(porCobrar).toEqual([1500, 500, 0]);
    });

    it("el nombre de la persona se toma sin espacios al principio ni al final", () => {
      const { grupo, ana } = grupoConAnaInactiva();

      grupo.cobrarGarantia("  ana ", dia(4));

      expect(ana.estado()).toBe("participando");
    });

    it("no se le puede cobrar la garantía a quien no es participante del grupo", () => {
      const grupo = nuevoGrupo();

      expect(() => {
        grupo.cobrarGarantia("ana", dia(2));
      }).toThrow("ana no es participante del grupo");
    });

    it("no se le puede cobrar la garantía a quien la tiene completa", () => {
      const { grupo } = grupoConAnaInactiva();

      expect(() => {
        grupo.cobrarGarantia("beto", dia(3));
      }).toThrow(TransicionInvalida);
      expect(grupo.caja().movimientos()).toHaveLength(2);
    });

    it("no se puede cobrar la garantía en una fecha anterior al último encuentro", () => {
      const { grupo, ana } = grupoConAnaInactiva();

      expect(() => {
        grupo.cobrarGarantia("ana", dia(1));
      }).toThrow("El cobro de la garantía no puede ser anterior al último encuentro");
      expect(ana.estado()).toBe("inactivo");
      expect(grupo.caja().movimientos()).toHaveLength(2);
    });

    it("no se puede cobrar la garantía en una fecha anterior al último reparto", () => {
      const { grupo, ana } = grupoConAnaInactiva();
      grupo.repartir("beto", dia(5));

      expect(() => {
        grupo.cobrarGarantia("ana", dia(4));
      }).toThrow("El cobro de la garantía no puede ser anterior al reparto a beto");
      expect(ana.estado()).toBe("inactivo");
    });
  });

  describe("encuentros", () => {
    it("registrar un encuentro hace ir a los asistentes y faltar a los ausentes", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      const encuentro = nuevoEncuentro({ asistentes: ["ana"], ausentes: ["beto"] });

      grupo.registrarEncuentro(encuentro);

      expect(ana.historial().at(-1)?.disparador()).toBe("voy");
      expect(beto.estado()).toBe("inactivo");
      expect(grupo.encuentros()).toEqual([encuentro]);
    });

    it("un encuentro no afecta a los participantes que no figuran ni como asistentes ni como ausentes", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      const carla = grupo.ingresar("carla", dia(1));

      grupo.registrarEncuentro(nuevoEncuentro({ asistentes: ["ana"], ausentes: ["beto"] }));

      expect(carla.historial()).toHaveLength(1);
    });

    it("la garantía de quien falta se distribuye en créditos entre los asistentes", () => {
      const grupo = nuevoGrupo(reglas({ garantia: 1000 }));
      grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));

      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto", "carla"], ausentes: ["ana"] }));

      expect(grupo.caja().montoPendienteDe("beto")).toBe(500);
      expect(grupo.caja().montoPendienteDe("carla")).toBe(500);
    });

    it("quien falta con la garantía incompleta pierde la que tiene y queda inactivo", () => {
      const grupo = nuevoGrupo(reglas({ garantia: 1000 }));
      const ana = grupo.ingresar("ana", dia(1));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(2), garantia: 2000 }));
      grupo.ingresar("beto", dia(2));

      grupo.registrarEncuentro(nuevoEncuentro({ numero: 3, asistentes: ["beto"], ausentes: ["ana"] }));

      expect(grupo.caja().montoPendienteDe("beto")).toBe(1000);
      expect(ana.estado()).toBe("inactivo");
      expect(ana.faltas()).toBe(1);
    });

    it("quien ya estaba inactivo no pierde nada más al volver a faltar", () => {
      const { grupo } = grupoConAnaInactiva();

      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["beto"], ausentes: ["ana"] }));

      expect(grupo.caja().montoPendienteDe("beto")).toBe(1000);
    });

    it("no se puede marcar ausente a quien superó la tolerancia de faltas", () => {
      const grupo = nuevoGrupo(reglas({ toleranciaDeFaltas: 1 }));
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["beto"], ausentes: ["ana"] })); // ana supera la tolerancia

      expect(() => {
        grupo.registrarEncuentro(nuevoEncuentro({ numero: 16, asistentes: ["beto"], ausentes: ["ana"] }));
      }).toThrow("ana no puede faltar");
      expect(ana.faltas()).toBe(2);
      expect(grupo.encuentros()).toHaveLength(2);
    });

    it("quien participa con una garantía menor a la actual no puede figurar como asistente de un encuentro", () => {
      const grupo = nuevoGrupo(reglas({ garantia: 1000 }));
      grupo.ingresar("ana", dia(1));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(2), garantia: 1500 }));

      expect(() => {
        grupo.registrarEncuentro(nuevoEncuentro({ numero: 3, asistentes: ["ana"] }));
      }).toThrow("ana no puede asistir");
      expect(grupo.encuentros()).toEqual([]);
    });

    it("no se puede registrar un encuentro anterior al último registrado", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["beto"] }));

      expect(() => {
        grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"] }));
      }).toThrow("El encuentro debe ser posterior al último registrado");
    });

    it("no se puede registrar un encuentro en la misma fecha que el último registrado", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["beto"] }));

      expect(() => {
        grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["beto"] }));
      }).toThrow("El encuentro debe ser posterior al último registrado");
    });

    it("no se puede registrar un encuentro anterior a un ingreso", () => {
      const grupo = nuevoGrupo();
      const beto = grupo.ingresar("beto", dia(1));
      grupo.ingresar("ana", dia(5));

      expect(() => {
        grupo.registrarEncuentro(nuevoEncuentro({ numero: 4, asistentes: ["beto"] }));
      }).toThrow("El encuentro no puede ser anterior al ingreso de ana");
      expect(beto.historial()).toHaveLength(1);
      expect(grupo.encuentros()).toEqual([]);
    });

    it("no se puede registrar un encuentro anterior al cobro de una garantía", () => {
      const { grupo } = grupoConAnaInactiva();
      grupo.cobrarGarantia("ana", dia(5));

      expect(() => {
        grupo.registrarEncuentro(nuevoEncuentro({ numero: 4, asistentes: ["beto"] }));
      }).toThrow("El encuentro no puede ser anterior al cobro de la garantía a ana");
      expect(grupo.encuentros()).toHaveLength(1);
    });

    it("no se puede registrar un encuentro anterior al último reparto", () => {
      const { grupo } = grupoConAnaInactiva();
      grupo.repartir("beto", dia(5));

      expect(() => {
        grupo.registrarEncuentro(nuevoEncuentro({ numero: 4, asistentes: ["beto"] }));
      }).toThrow("El encuentro no puede ser anterior al reparto a beto");
      expect(grupo.encuentros()).toHaveLength(1);
    });

    it("se puede registrar un encuentro en la misma fecha que el último cobro y el último reparto", () => {
      const { grupo, ana } = grupoConAnaInactiva();
      grupo.cobrarGarantia("ana", dia(9));
      grupo.repartir("beto", dia(9));
      const encuentro = nuevoEncuentro({ numero: 9, asistentes: ["ana", "beto"] });

      grupo.registrarEncuentro(encuentro);

      expect(ana.historial().at(-1)?.disparador()).toBe("voy");
      expect(grupo.encuentros().at(-1)).toBe(encuentro);
    });

    it("los asistentes a un encuentro deben ser participantes del grupo", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      const encuentro = nuevoEncuentro({ asistentes: ["ana", "alguien de afuera"] });

      expect(() => {
        grupo.registrarEncuentro(encuentro);
      }).toThrow("alguien de afuera no es participante del grupo");
      expect(ana.historial()).toHaveLength(1);
      expect(grupo.encuentros()).toEqual([]);
    });

    it("los ausentes de un encuentro deben ser participantes del grupo", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      const encuentro = nuevoEncuentro({ asistentes: ["ana"], ausentes: ["beto", "alguien de afuera"] });

      expect(() => {
        grupo.registrarEncuentro(encuentro);
      }).toThrow("alguien de afuera no es participante del grupo");
      expect(ana.historial()).toHaveLength(1);
      expect(beto.estado()).toBe("participando");
      expect(grupo.encuentros()).toEqual([]);
    });

    it("un inactivo no puede figurar como asistente de un encuentro", () => {
      const { grupo, ana, beto } = grupoConAnaInactiva();
      const encuentro = nuevoEncuentro({ numero: 9, asistentes: ["beto", "ana"] });

      expect(() => {
        grupo.registrarEncuentro(encuentro);
      }).toThrow("ana no puede asistir");
      expect(ana.estado()).toBe("inactivo");
      expect(beto.historial()).toHaveLength(2);
      expect(grupo.encuentros()).toHaveLength(1);
    });

    it("quien ingresó el mismo día del encuentro puede faltar a él", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("beto", dia(1));
      const ana = grupo.ingresar("ana", dia(2));

      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));

      expect(ana.estado()).toBe("inactivo");
    });
  });

  describe("posibles asistentes", () => {
    it("son quienes participan y los inactivos que no superan la tolerancia de faltas", () => {
      const grupo = nuevoGrupo(reglas({ toleranciaDeFaltas: 1 }));
      grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      const carla = grupo.ingresar("carla", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana", "carla"] }));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["beto"], ausentes: ["ana"] })); // ana supera la tolerancia

      const posibles = grupo.posiblesAsistentes();

      expect(posibles).toEqual([beto, carla]);
    });

    it("pueden asistir quienes participan con la garantía actual completa", () => {
      const grupo = nuevoGrupo(reglas({ garantia: 1000 }));
      const ana = grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(3), garantia: 1500 }));
      const carla = grupo.ingresar("carla", dia(3));

      const pueden = [ana, beto, carla].map((participante) => grupo.puedeAsistir(participante));

      expect(pueden).toEqual([false, false, true]);
    });

    it("la situación de cada uno distingue a quienes participan con la garantía actual completa de quienes la tienen incompleta", () => {
      const grupo = nuevoGrupo(reglas({ garantia: 1000 }));
      const ana = grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(3), garantia: 1500 }));
      const carla = grupo.ingresar("carla", dia(3));

      const situaciones = [ana, beto, carla].map((participante) => grupo.situacionDe(participante));

      expect(situaciones).toEqual(["inactivo", "garantía incompleta", "participando"]);
    });

    it("quienes ya no participan son los que superaron la tolerancia de faltas", () => {
      const grupo = nuevoGrupo(reglas({ toleranciaDeFaltas: 1 }));
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana", "carla"] }));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["beto"], ausentes: ["ana"] })); // ana supera la tolerancia

      const quienesYaNoParticipan = grupo.quienesYaNoParticipan();

      expect(quienesYaNoParticipan).toEqual([ana]);
    });

    it("la tolerancia de faltas es la de las reglas actuales", () => {
      const grupo = nuevoGrupo(reglas({ toleranciaDeFaltas: 1 }));
      const ana = grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["beto"], ausentes: ["ana"] })); // ana supera la tolerancia
      grupo.cambiarReglas(reglas({ rigeDesde: dia(10), toleranciaDeFaltas: 2 }));

      const posibles = grupo.posiblesAsistentes();

      expect(posibles).toEqual([ana, beto]);
    });
  });

  describe("saldos", () => {
    it("quien tiene créditos pendientes tiene un saldo positivo por ellos, y quien no los tiene no tiene saldo", () => {
      const grupo = nuevoGrupo(reglas({ garantia: 1000 }));
      grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["carla"], ausentes: ["ana", "beto"] }));

      const saldos = grupo.saldos();

      expect(saldos.map((saldo) => [saldo.nombre(), saldo.monto()])).toEqual([["carla", 2000]]);
    });

    it("quien tiene la garantía incompleta tiene un saldo negativo por lo que le falta, aparte del positivo por sus créditos, y un inactivo no debe nada", () => {
      const { grupo } = grupoConAnaInactiva(); // beto tiene $ 1.000 de crédito por la falta de ana
      grupo.cambiarReglas(reglas({ rigeDesde: dia(3), garantia: 1500 }));

      const saldos = grupo.saldos();

      expect(saldos.map((saldo) => [saldo.nombre(), saldo.monto()])).toEqual([
        ["beto", -500],
        ["beto", 1000],
      ]);
    });
  });

  describe("repartos", () => {
    it("repartir entrega los créditos pendientes de una persona y queda registrado en la caja", () => {
      const { grupo } = grupoConAnaInactiva();

      const reparto = grupo.repartir("beto", dia(4));

      expect(reparto.monto()).toBe(1000);
      expect(grupo.caja().montoPendienteDe("beto")).toBe(0);
      expect(grupo.caja().repartos()).toEqual([reparto]);
    });

    it("no se puede repartir en una fecha anterior al último cobro", () => {
      const { grupo } = grupoConAnaInactiva();
      grupo.cobrarGarantia("ana", dia(5));

      expect(() => {
        grupo.repartir("beto", dia(4));
      }).toThrow("El reparto no puede ser anterior al cobro de la garantía a ana");
      expect(grupo.caja().repartos()).toEqual([]);
    });

    it("no se puede repartir en una fecha anterior al último reparto", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto", "carla"], ausentes: ["ana"] }));
      const repartoABeto = grupo.repartir("beto", dia(5));

      expect(() => {
        grupo.repartir("carla", dia(4));
      }).toThrow("El reparto no puede ser anterior al reparto a beto");
      expect(grupo.caja().montoPendienteDe("carla")).toBe(500);
      expect(grupo.caja().repartos()).toEqual([repartoABeto]);
    });

    it("no se puede repartir en una fecha anterior al último encuentro", () => {
      const { grupo } = grupoConAnaInactiva();
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["beto"] }));

      expect(() => {
        grupo.repartir("beto", dia(5));
      }).toThrow("El reparto no puede ser anterior al último encuentro");
      expect(grupo.caja().repartos()).toEqual([]);
    });
  });
});
