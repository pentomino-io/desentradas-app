import { describe, expect, it } from "vitest";
import type { Caja } from "../../src/models/Caja.ts";
import type { Credito } from "../../src/models/Credito.ts";
import type { Encuentro } from "../../src/models/Encuentro.ts";
import { Grupo } from "../../src/models/Grupo.ts";
import { desempate, dia, nuevoEncuentro, nuevoGrupo, reglas } from "./factories.ts";

const grupoConAnaMorosa = () => {
  const grupo = nuevoGrupo();
  const ana = grupo.ingresar("ana", dia(1));
  const beto = grupo.ingresar("beto", dia(1));
  grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));
  grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["beto"], ausentes: ["ana"] }));
  return { grupo, ana, beto };
};

const grupoConAnaFinalizada = () => {
  const { grupo, ana, beto } = grupoConAnaMorosa();
  grupo.cobrar("ana", 1000, dia(10));
  return { grupo, ana, beto };
};

const grupoConBetoFinalizadoPorFaltas = () => {
  const grupo = nuevoGrupo(reglas({ toleranciaDeFaltas: 1 }));
  const ana = grupo.ingresar("ana", dia(1));
  const beto = grupo.ingresar("beto", dia(1));
  const carla = grupo.ingresar("carla", dia(1));
  grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto", "carla"], ausentes: ["ana"] }));
  grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["carla"], ausentes: ["ana", "beto"] }));
  grupo.cobrar("beto", 1000, dia(10));
  grupo.registrarEncuentro(nuevoEncuentro({ numero: 16, asistentes: ["carla"], ausentes: ["beto"] }));
  return { grupo, ana, beto, carla };
};

const esperarCobroABetoConUnCreditoSuyoYaConsumido = (caja: Caja, fecha: Date, encuentroFaltado: Encuentro) => {
  expect(caja.cobros()).toHaveLength(2);
  const [, cobroABeto] = caja.cobros();
  expect(cobroABeto.deudor()).toBe("beto");
  expect(cobroABeto.monto()).toBe(500);
  expect(cobroABeto.fecha()).toEqual(fecha);
  expect(cobroABeto.encuentroFaltado()).toBe(encuentroFaltado);
  const creditoAplicado = cobroABeto.origen() as Credito;
  expect(creditoAplicado.acreedor()).toBe("beto");
  expect(creditoAplicado.monto()).toBe(500);
  expect(caja.creditosPendientesDe("beto")).not.toContain(creditoAplicado);
};

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

    it("las nuevas reglas deben regir desde después del último encuentro registrado", () => {
      const reglasIniciales = reglas();
      const grupo = nuevoGrupo(reglasIniciales);
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["beto"] }));

      expect(() => {
        grupo.cambiarReglas(reglas({ rigeDesde: dia(9) }));
      }).toThrow("Las nuevas reglas deben regir desde después del último encuentro registrado");
      expect(grupo.historialDeReglas()).toEqual([reglasIniciales]);
    });

    it("las nuevas reglas pueden regir desde una fecha futura", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"] }));
      const nuevasReglas = reglas({ rigeDesde: dia(30) });

      grupo.cambiarReglas(nuevasReglas);

      expect(grupo.reglas()).toBe(nuevasReglas);
    });

    it("si no hubo encuentros ni nadie se rige por la versión actual, las nuevas reglas la reemplazan", () => {
      const reglasIniciales = reglas();
      const grupo = nuevoGrupo(reglasIniciales);
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"] }));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(3) }));
      const reglasDefinitivas = reglas({ rigeDesde: dia(4) });

      grupo.cambiarReglas(reglasDefinitivas);

      expect(grupo.historialDeReglas()).toEqual([reglasIniciales, reglasDefinitivas]);
    });

    it("las reglas iniciales también se reemplazan si todavía no hubo encuentros ni ingresos", () => {
      const grupo = nuevoGrupo();
      const reglasDefinitivas = reglas({ rigeDesde: dia(4) });

      grupo.cambiarReglas(reglasDefinitivas);

      expect(grupo.historialDeReglas()).toEqual([reglasDefinitivas]);
    });

    it("si alguien se rige por la versión actual, las nuevas reglas no la reemplazan aunque no haya habido encuentros", () => {
      const reglasIniciales = reglas();
      const grupo = nuevoGrupo(reglasIniciales);
      grupo.ingresar("ana", dia(1));
      const nuevasReglas = reglas({ rigeDesde: dia(4) });

      grupo.cambiarReglas(nuevasReglas);

      expect(grupo.reglasAnteriores()).toEqual([reglasIniciales]);
    });

    it("el monto por falta es el de las reglas vigentes la última vez que fue", () => {
      const grupo = nuevoGrupo(reglas({ montoPorFalta: 1000 }));
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["ana", "beto"] }));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(5), montoPorFalta: 2000 }));

      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["beto"], ausentes: ["ana"] }));

      expect(ana.deudaAl(dia(10))).toBe(1000);
    });

    it("ir a un encuentro después de un cambio de reglas hace que la próxima falta se rija por las nuevas", () => {
      const grupo = nuevoGrupo(reglas({ montoPorFalta: 1000 }));
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["ana", "beto"] }));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(5), montoPorFalta: 2000 }));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["ana", "beto"] }));

      grupo.registrarEncuentro(nuevoEncuentro({ numero: 16, asistentes: ["beto"], ausentes: ["ana"] }));

      expect(ana.deudaAl(dia(17))).toBe(2000);
    });

    it("quien va a un encuentro antes de que rijan las nuevas reglas se sigue rigiendo por las anteriores", () => {
      const grupo = nuevoGrupo(reglas({ montoPorFalta: 1000 }));
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["ana", "beto"] }));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(20), montoPorFalta: 2000 }));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["ana", "beto"] }));

      grupo.registrarEncuentro(nuevoEncuentro({ numero: 23, asistentes: ["beto"], ausentes: ["ana"] }));

      expect(ana.deudaAl(dia(24))).toBe(1000);
    });

    it("la tolerancia de faltas es la de las reglas vigentes la última vez que fue", () => {
      const grupo = nuevoGrupo(reglas({ toleranciaDeFaltas: 3 }));
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));
      grupo.cobrar("ana", 1000, dia(3));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["beto"], ausentes: ["ana"] }));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(10), toleranciaDeFaltas: 1 }));

      grupo.registrarEncuentro(nuevoEncuentro({ numero: 16, asistentes: ["beto"], ausentes: ["ana"] }));

      expect(ana.estado()).toBe("libre de deuda");
      expect(ana.faltas()).toBe(3);
    });

    it("quien va a un encuentro después de un cambio de tolerancia queda finalizado según la nueva", () => {
      const grupo = nuevoGrupo(reglas({ toleranciaDeFaltas: 3 }));
      grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(10), toleranciaDeFaltas: 1 }));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 16, asistentes: ["ana", "beto"] }));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 23, asistentes: ["ana"], ausentes: ["beto"] }));
      grupo.cobrar("beto", 1000, dia(24));

      grupo.registrarEncuentro(nuevoEncuentro({ numero: 30, asistentes: ["ana"], ausentes: ["beto"] }));

      expect(beto.motivoDeFinalizacion()).toBe("por faltas");
    });

    it("un cambio de reglas no altera las deudas existentes", () => {
      const grupo = nuevoGrupo(reglas({ montoPorFalta: 1000 }));
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(5), montoPorFalta: 2000 }));

      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["beto"], ausentes: ["ana"] }));

      expect(ana.estado()).toBe("moroso");
      expect(ana.deudaAl(dia(12))).toBe(1000);
    });
  });

  describe("ingreso", () => {
    it("al ingresar, la persona queda como participante activo", () => {
      const grupo = nuevoGrupo();

      const ana = grupo.ingresar("ana", dia(1));

      expect(grupo.participanteActivo("ana")).toBe(ana);
      expect(grupo.participantes()).toEqual([ana]);
    });

    it("quien ingresa se rige por las reglas vigentes en la fecha de ingreso", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"] }));
      const reglasVigentes = reglas({ rigeDesde: dia(3) });
      grupo.cambiarReglas(reglasVigentes);
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 4, asistentes: ["beto"] }));
      grupo.cambiarReglas(reglas({ rigeDesde: dia(20) }));

      const ana = grupo.ingresar("ana", dia(5));

      expect(ana.reglas()).toBe(reglasVigentes);
    });

    it("no se puede ingresar antes de que rijan las reglas iniciales", () => {
      const grupo = nuevoGrupo(reglas({ rigeDesde: dia(5) }));

      expect(() => {
        grupo.ingresar("ana", dia(1));
      }).toThrow("No hay reglas vigentes en esa fecha");
    });

    it("no hay participante activo para quien no ingresó", () => {
      const grupo = nuevoGrupo();

      expect(grupo.participanteActivo("ana")).toBeUndefined();
    });

    it("una persona no puede ingresar mientras tenga una participación activa", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));

      expect(() => {
        grupo.ingresar("ana", dia(2));
      }).toThrow("ana ya tiene una participación activa");
    });

    it("una persona que ya participó no puede volver a ingresar: debe reingresar", () => {
      const { grupo, ana } = grupoConAnaFinalizada();

      expect(() => {
        grupo.ingresar("ana", dia(11));
      }).toThrow("ana ya participó del grupo, debe reingresar");
      expect(grupo.participantesFinalizados()).toEqual([ana]);
    });

    it("el nombre de la persona se guarda sin espacios al principio ni al final", () => {
      const grupo = nuevoGrupo();

      const ana = grupo.ingresar("  ana ", dia(1));

      expect(ana.nombre()).toBe("ana");
      expect(grupo.participanteActivo("ana")).toBe(ana);
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

      expect(grupo.participanteActivo("ana")).toBe(ana);
      expect(grupo.participanteActivo("Ana")).toBe(anaConMayuscula);
    });
  });

  describe("reingreso", () => {
    it("quien tiene la participación finalizada puede reingresar y retoma esa misma participación", () => {
      const { grupo, ana, beto } = grupoConAnaFinalizada();

      const reingresada = grupo.reingresar("ana", dia(11));

      expect(reingresada).toBe(ana);
      expect(ana.estado()).toBe("participando");
      expect(grupo.participanteActivo("ana")).toBe(ana);
      expect(grupo.participantes()).toEqual(expect.arrayContaining([ana, beto]));
      expect(grupo.participantes()).toHaveLength(2);
      expect(grupo.participantesFinalizados()).toEqual([]);
    });

    it("quien reingresa se rige por las reglas vigentes en la fecha de reingreso", () => {
      const { grupo, ana } = grupoConAnaFinalizada();
      const reglasVigentes = reglas({ rigeDesde: dia(11) });
      grupo.cambiarReglas(reglasVigentes);

      grupo.reingresar("ana", dia(12));

      expect(ana.reglas()).toBe(reglasVigentes);
    });

    it("el nombre de la persona también se toma sin espacios al principio ni al final", () => {
      const { grupo, ana } = grupoConAnaFinalizada();

      const reingresada = grupo.reingresar("  ana ", dia(11));

      expect(reingresada).toBe(ana);
      expect(grupo.participanteActivo("ana")).toBe(ana);
    });

    it("no se puede reingresar a quien tiene una participación activa", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));

      expect(() => {
        grupo.reingresar("ana", dia(2));
      }).toThrow("ana ya tiene una participación activa");
    });

    it("no se puede reingresar a quien nunca ingresó", () => {
      const grupo = nuevoGrupo();

      expect(() => {
        grupo.reingresar("ana", dia(2));
      }).toThrow("ana nunca ingresó al grupo");
    });

    it("ya participó quien tiene una participación finalizada", () => {
      const { grupo } = grupoConAnaFinalizada();

      const anaYaParticipo = grupo.yaParticipo("ana");
      const betoYaParticipo = grupo.yaParticipo("beto");
      const carlaYaParticipo = grupo.yaParticipo("carla");

      expect(anaYaParticipo).toBe(true);
      expect(betoYaParticipo).toBe(false);
      expect(carlaYaParticipo).toBe(false);
    });

    it("para saber si ya participó, el nombre se toma sin espacios al principio ni al final", () => {
      const { grupo } = grupoConAnaFinalizada();

      const yaParticipo = grupo.yaParticipo(" ana ");

      expect(yaParticipo).toBe(true);
    });

    it("quien reingresa conserva los créditos pendientes a su nombre", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["ana", "carla"], ausentes: ["beto"] }));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["carla"], ausentes: ["ana", "beto"] }));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 16, asistentes: ["carla"], ausentes: ["ana"] }));
      grupo.cobrar("ana", 1000, dia(17)); // ana salda la morosidad y queda finalizada
      grupo.cobrar("beto", 1000, dia(18)); // ana recibe 500 de crédito aunque esté finalizada

      grupo.reingresar("ana", dia(19));

      expect(grupo.caja().montoPendienteDe("ana")).toBe(500);
    });
  });

  describe("finalización", () => {
    it("una participación finalizada deja de estar activa y pasa a los participantes finalizados", () => {
      const { grupo, ana, beto } = grupoConAnaMorosa();

      grupo.cobrar("ana", 1000, dia(10));

      expect(ana.estaActivo()).toBe(false);
      expect(grupo.participanteActivo("ana")).toBeUndefined();
      expect(grupo.participantes()).toEqual([beto]);
      expect(grupo.participantesFinalizados()).toEqual([ana]);
    });

    it("quien queda finalizado por faltas al registrar un encuentro pasa a los participantes finalizados", () => {
      const grupo = nuevoGrupo(reglas({ toleranciaDeFaltas: 2 }));
      const ana = grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));
      grupo.cobrar("ana", 1000, dia(3));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["beto"], ausentes: ["ana"] })); // ana llega a las dos faltas toleradas

      grupo.registrarEncuentro(nuevoEncuentro({ numero: 16, asistentes: ["beto"], ausentes: ["ana"] }));

      expect(ana.motivoDeFinalizacion()).toBe("por faltas");
      expect(grupo.participanteActivo("ana")).toBeUndefined();
      expect(grupo.participantes()).toEqual([beto]);
      expect(grupo.participantesFinalizados()).toEqual([ana]);
    });
  });

  describe("encuentros", () => {
    it("registrar un encuentro hace ir a los asistentes y faltar a los ausentes", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      const encuentro = nuevoEncuentro({ asistentes: ["ana"], ausentes: ["beto"] });

      grupo.registrarEncuentro(encuentro);

      expect(ana.estado()).toBe("participando");
      expect(beto.estado()).toBe("en deuda");
      expect(grupo.encuentros()).toEqual([encuentro]);
    });

    it("un encuentro no afecta a los participantes activos que no figuran ni como asistentes ni como ausentes", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      const carla = grupo.ingresar("carla", dia(1));

      grupo.registrarEncuentro(nuevoEncuentro({ asistentes: ["ana"], ausentes: ["beto"] }));

      expect(carla.estado()).toBe("participando");
      expect(carla.historial()).toHaveLength(1);
    });

    it("los participantes finalizados no son afectados por los encuentros", () => {
      const { grupo, ana } = grupoConAnaFinalizada();
      const transicionesAlFinalizar = ana.historial().length;

      grupo.registrarEncuentro(nuevoEncuentro({ numero: 16, asistentes: ["beto"] }));

      expect(ana.historial()).toHaveLength(transicionesAlFinalizar);
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

    it("no se puede registrar un encuentro anterior al último cobro", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));
      grupo.cobrar("ana", 1000, dia(5));

      expect(() => {
        grupo.registrarEncuentro(nuevoEncuentro({ numero: 4, asistentes: ["ana", "beto"] }));
      }).toThrow("El encuentro no puede ser anterior al último cobro");
      expect(ana.estado()).toBe("libre de deuda");
      expect(grupo.encuentros()).toHaveLength(1);
    });

    it("no se puede registrar un encuentro anterior al último reparto", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));
      grupo.cobrar("ana", 1000, dia(3));
      grupo.repartir("beto", dia(5));

      expect(() => {
        grupo.registrarEncuentro(nuevoEncuentro({ numero: 4, asistentes: ["ana", "beto"] }));
      }).toThrow("El encuentro no puede ser anterior al último reparto");
      expect(grupo.encuentros()).toHaveLength(1);
    });

    it("se puede registrar un encuentro en la misma fecha que el último cobro y el último reparto", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));
      grupo.cobrar("ana", 1000, dia(9));
      grupo.repartir("beto", dia(9));
      const encuentro = nuevoEncuentro({ numero: 9, asistentes: ["ana", "beto"] });

      grupo.registrarEncuentro(encuentro);

      expect(ana.estado()).toBe("participando");
      expect(grupo.encuentros().at(-1)).toBe(encuentro);
    });

    it("los asistentes a un encuentro deben ser participantes activos del grupo", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      const encuentro = nuevoEncuentro({ asistentes: ["ana", "alguien de afuera"] });

      expect(() => {
        grupo.registrarEncuentro(encuentro);
      }).toThrow("alguien de afuera no es un participante activo");
      expect(ana.estado()).toBe("participando");
      expect(grupo.encuentros()).toEqual([]);
    });

    it("los ausentes de un encuentro deben ser participantes activos del grupo", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      const encuentro = nuevoEncuentro({ asistentes: ["ana"], ausentes: ["beto", "alguien de afuera"] });

      expect(() => {
        grupo.registrarEncuentro(encuentro);
      }).toThrow("alguien de afuera no es un participante activo");
      expect(ana.historial()).toHaveLength(1);
      expect(beto.estado()).toBe("participando");
      expect(grupo.encuentros()).toEqual([]);
    });

    it("quien debe no puede figurar como asistente de un encuentro", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] })); // ana queda en deuda
      const encuentro = nuevoEncuentro({ numero: 9, asistentes: ["beto", "ana"] });

      expect(() => {
        grupo.registrarEncuentro(encuentro);
      }).toThrow("ana no puede asistir");
      expect(ana.estado()).toBe("en deuda");
      expect(beto.estado()).toBe("participando");
      expect(grupo.encuentros()).toHaveLength(1);
    });

    it("un moroso no puede figurar como ausente de un encuentro", () => {
      const { grupo, ana } = grupoConAnaMorosa();
      const transicionesAlVolverseMoroso = ana.historial().length;

      expect(() => {
        grupo.registrarEncuentro(nuevoEncuentro({ numero: 16, asistentes: ["beto"], ausentes: ["ana"] }));
      }).toThrow("ana no puede faltar");
      expect(ana.historial()).toHaveLength(transicionesAlVolverseMoroso);
      expect(grupo.encuentros()).toHaveLength(2);
    });

    it("no se puede registrar un encuentro con un ausente que ingresó después", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("beto", dia(1));
      grupo.ingresar("ana", dia(3));

      expect(() => {
        grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));
      }).toThrow("ana ingresó después del encuentro");
    });

    it("no se puede registrar un encuentro con un ausente que reingresó después", () => {
      const { grupo } = grupoConAnaFinalizada();
      grupo.reingresar("ana", dia(20));

      expect(() => {
        grupo.registrarEncuentro(nuevoEncuentro({ numero: 16, asistentes: ["beto"], ausentes: ["ana"] }));
      }).toThrow("ana ingresó después del encuentro");
    });

    it("quien ingresó el mismo día del encuentro sí participa", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("beto", dia(1));
      const ana = grupo.ingresar("ana", dia(2));

      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));

      expect(ana.estado()).toBe("en deuda");
    });

    it("no se puede registrar un encuentro con un asistente que ingresó después", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("beto", dia(1));
      grupo.ingresar("ana", dia(3));

      expect(() => {
        grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto", "ana"] }));
      }).toThrow("ana ingresó después del encuentro");
    });
  });

  describe("saldos", () => {
    it("quien debe tiene un saldo negativo por su deuda, y quien no debe ni tiene créditos no tiene saldo", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));

      const saldos = grupo.saldosAl(dia(11));

      expect(saldos.map((saldo) => [saldo.nombre(), saldo.monto()])).toEqual([["ana", -1000]]);
    });

    it("quien tiene créditos pendientes tiene un saldo positivo por ellos, aunque su participación esté finalizada", () => {
      const { grupo } = grupoConBetoFinalizadoPorFaltas();
      grupo.cobrar("ana", 1000, dia(17)); // ana también queda finalizada; beto con 500 pendientes y carla con 1500

      const saldos = grupo.saldosAl(dia(17));

      expect(saldos.map((saldo) => [saldo.nombre(), saldo.monto()])).toEqual([
        ["carla", 1500],
        ["beto", 500],
      ]);
    });
  });

  describe("posibles asistentes", () => {
    it("quien está en deuda es un posible asistente, y un moroso no", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      const carla = grupo.ingresar("carla", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto", "carla"], ausentes: ["ana"] })); // ana queda en deuda
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["beto"], ausentes: ["ana", "carla"] })); // ana queda morosa y carla en deuda

      const posibles = grupo.posiblesAsistentes();

      expect(posibles).toEqual([beto, carla]);
    });
  });

  describe("cobros", () => {
    it("cobrar hace pagar al participante", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ asistentes: ["beto"], ausentes: ["ana"] }));

      grupo.cobrar("ana", 1000, dia(3));

      expect(ana.estado()).toBe("libre de deuda");
    });

    it("no se puede cobrar a quien no tiene una participación activa", () => {
      const grupo = nuevoGrupo();

      expect(() => {
        grupo.cobrar("ana", 1000, dia(3));
      }).toThrow("ana no tiene una participación activa");
    });

    it("quien está en deuda puede pagar en la puerta y asistir al mismo encuentro", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));
      const siguienteEncuentro = nuevoEncuentro({ numero: 9, asistentes: ["ana", "beto"] });

      grupo.cobrar("ana", 1000, siguienteEncuentro.fecha());
      grupo.registrarEncuentro(siguienteEncuentro);

      expect(ana.estado()).toBe("participando");
    });

    it("cobrar registra un cobro en efectivo por el encuentro faltado", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      const encuentro = nuevoEncuentro({ numero: 2, asistentes: ["beto", "carla"], ausentes: ["ana"] });
      grupo.registrarEncuentro(encuentro);

      grupo.cobrar("ana", 1000, dia(3));

      const caja = grupo.caja();
      expect(caja.cobros()).toHaveLength(1);
      const [cobro] = caja.cobros();
      expect(cobro.deudor()).toBe("ana");
      expect(cobro.monto()).toBe(1000);
      expect(cobro.fecha()).toEqual(dia(3));
      expect(cobro.encuentroFaltado()).toBe(encuentro);
      expect(cobro.esEnEfectivo()).toBe(true);
    });

    it("no se puede cobrar en una fecha anterior al último encuentro", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto", "carla"], ausentes: ["ana"] }));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["carla"], ausentes: ["ana", "beto"] }));

      expect(() => {
        grupo.cobrar("ana", 1000, dia(5));
      }).toThrow("El cobro no puede ser anterior al último encuentro");
      expect(ana.deudaAl(dia(9))).toBe(1000);
      expect(grupo.caja().cobros()).toEqual([]);
    });
  });

  describe("créditos", () => {
    it("un cobro se distribuye en créditos entre los asistentes al encuentro faltado", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto", "carla"], ausentes: ["ana"] }));

      grupo.cobrar("ana", 1000, dia(3));

      const caja = grupo.caja();
      expect(caja.montoPendienteDe("beto")).toBe(500);
      expect(caja.montoPendienteDe("carla")).toBe(500);
    });

    it("un cobro parcial también se distribuye", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto", "carla"], ausentes: ["ana"] }));

      grupo.cobrar("ana", 400, dia(3));

      expect(ana.estado()).toBe("en deuda");
      expect(ana.deudaAl(dia(3))).toBe(600);
      expect(grupo.caja().montoPendienteDe("beto")).toBe(200);
      expect(grupo.caja().montoPendienteDe("carla")).toBe(200);
    });

    it("el crédito de quien debe se aplica de inmediato a su deuda como un nuevo cobro, que se vuelve a distribuir", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto", "carla"], ausentes: ["ana"] }));
      const encuentroQueDebeBeto = nuevoEncuentro({ numero: 9, asistentes: ["carla"], ausentes: ["ana", "beto"] });
      grupo.registrarEncuentro(encuentroQueDebeBeto);

      grupo.cobrar("ana", 1000, dia(10));

      expect(beto.deudaAl(dia(10))).toBe(500);
      const caja = grupo.caja();
      expect(caja.montoPendienteDe("beto")).toBe(0);
      expect(caja.montoPendienteDe("carla")).toBe(1000);
      esperarCobroABetoConUnCreditoSuyoYaConsumido(caja, dia(10), encuentroQueDebeBeto);
    });

    it("si el crédito supera la deuda, se aplica sólo hasta saldarla y el excedente queda pendiente", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto", "carla"], ausentes: ["ana"] }));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["carla"], ausentes: ["ana", "beto"] }));
      grupo.cobrar("beto", 600, dia(9));

      grupo.cobrar("ana", 1000, dia(10));

      expect(beto.estado()).toBe("libre de deuda");
      expect(beto.deudaAl(dia(10))).toBe(0);
      expect(grupo.caja().montoPendienteDe("beto")).toBe(100);
      expect(grupo.caja().montoPendienteDe("carla")).toBe(600 + 500 + 400);
    });

    it("saldar la deuda de un moroso con un crédito finaliza su participación por pago de morosidad", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto", "carla"], ausentes: ["ana"] }));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["carla"], ausentes: ["ana", "beto"] }));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 16, asistentes: ["carla"], ausentes: ["beto"] }));
      grupo.cobrar("beto", 500, dia(16)); // beto sigue moroso por los 500 que faltan

      grupo.cobrar("ana", 1000, dia(17));

      expect(beto.estado()).toBe("finalizado");
      expect(beto.motivoDeFinalizacion()).toBe("por pago de morosidad");
      expect(grupo.participantesFinalizados()).toEqual([ana, beto]);
      expect(grupo.caja().montoPendienteDe("beto")).toBe(0);
      expect(grupo.caja().montoPendienteDe("carla")).toBe(500 + 500 + 500);
    });

    it("quien debe no queda con créditos pendientes", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.ingresar("dario", dia(1));
      grupo.registrarEncuentro(
        nuevoEncuentro({ numero: 2, asistentes: ["beto", "carla", "dario"], ausentes: ["ana"] }),
      );
      grupo.registrarEncuentro(
        nuevoEncuentro({ numero: 9, asistentes: ["carla", "dario"], ausentes: ["ana", "beto"] }),
      );

      grupo.cobrar("ana", 300, dia(10));

      expect(beto.deudaAl(dia(10))).toBe(900);
      expect(grupo.caja().montoPendienteDe("beto")).toBe(0);
      expect(grupo.caja().totalPendiente()).toBe(300);
    });

    it("al quedar en deuda por faltar, los créditos pendientes se aplican a la deuda como un nuevo cobro en la fecha del encuentro", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto", "carla"], ausentes: ["ana"] }));
      grupo.cobrar("ana", 1000, dia(3)); // beto queda con 500 pendientes
      const encuentroQueFaltaBeto = nuevoEncuentro({ numero: 9, asistentes: ["carla"], ausentes: ["ana", "beto"] });

      grupo.registrarEncuentro(encuentroQueFaltaBeto);

      expect(beto.estado()).toBe("en deuda");
      expect(beto.deudaAl(dia(9))).toBe(500);
      const caja = grupo.caja();
      expect(caja.montoPendienteDe("beto")).toBe(0);
      expect(caja.montoPendienteDe("carla")).toBe(1000);
      esperarCobroABetoConUnCreditoSuyoYaConsumido(caja, dia(9), encuentroQueFaltaBeto);
    });

    it("si los créditos pendientes superan la deuda por faltar, se aplican sólo hasta saldarla y el excedente queda pendiente", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      const beto = grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana", "carla"] }));
      grupo.cobrar("ana", 400, dia(3));
      grupo.cobrar("carla", 1000, dia(3)); // beto queda con 400 + 1000 pendientes

      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["carla"], ausentes: ["ana", "beto"] }));

      expect(beto.estado()).toBe("libre de deuda");
      expect(beto.deudaAl(dia(9))).toBe(0);
      expect(grupo.caja().montoPendienteDe("beto")).toBe(400);
      expect(grupo.caja().montoPendienteDe("carla")).toBe(1000);
    });

    it("los créditos de quien está finalizado quedan pendientes a su nombre", () => {
      const { grupo } = grupoConBetoFinalizadoPorFaltas();

      grupo.cobrar("ana", 1000, dia(17));

      expect(grupo.caja().montoPendienteDe("beto")).toBe(500);
    });

    it("quien reingresa con créditos pendientes los aplica a la deuda cuando vuelve a faltar", () => {
      const { grupo, beto } = grupoConBetoFinalizadoPorFaltas();
      grupo.cobrar("ana", 1000, dia(17)); // beto queda con 500 pendientes
      grupo.reingresar("beto", dia(18));

      grupo.registrarEncuentro(nuevoEncuentro({ numero: 23, asistentes: ["carla"], ausentes: ["beto"] }));

      expect(beto.deudaAl(dia(23))).toBe(500);
      expect(grupo.caja().montoPendienteDe("beto")).toBe(0);
    });

    it("no se puede cobrar en una fecha anterior al último cobro", () => {
      const grupo = nuevoGrupo();
      const ana = grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));
      grupo.cobrar("ana", 400, dia(5));

      expect(() => {
        grupo.cobrar("ana", 100, dia(4));
      }).toThrow("El cobro no puede ser anterior al último cobro");
      expect(ana.deudaAl(dia(5))).toBe(600);
      expect(grupo.caja().cobros()).toHaveLength(1);
    });

    it("no se puede cobrar en una fecha anterior al último reparto", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      const carla = grupo.ingresar("carla", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana", "carla"] }));
      grupo.cobrar("ana", 1000, dia(3));
      grupo.repartir("beto", dia(5));

      expect(() => {
        grupo.cobrar("carla", 1000, dia(4));
      }).toThrow("El cobro no puede ser anterior al último reparto");
      expect(carla.deudaAl(dia(5))).toBe(1000);
      expect(grupo.caja().cobros()).toHaveLength(1);
    });

    it("repartir entrega los créditos pendientes de una persona y queda registrado en la caja", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));
      grupo.cobrar("ana", 1000, dia(3));

      const reparto = grupo.repartir("beto", dia(4));

      expect(reparto.monto()).toBe(1000);
      expect(grupo.caja().montoPendienteDe("beto")).toBe(0);
      expect(grupo.caja().repartos()).toEqual([reparto]);
    });

    it("no se puede repartir en una fecha anterior al último cobro", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana", "carla"] }));
      grupo.cobrar("ana", 1000, dia(3));
      grupo.cobrar("carla", 1000, dia(5));

      expect(() => {
        grupo.repartir("beto", dia(4));
      }).toThrow("El reparto no puede ser anterior al último cobro");
      expect(grupo.caja().montoPendienteDe("beto")).toBe(2000);
      expect(grupo.caja().repartos()).toEqual([]);
    });

    it("no se puede repartir en una fecha anterior al último reparto", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.ingresar("carla", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto", "carla"], ausentes: ["ana"] }));
      grupo.cobrar("ana", 1000, dia(3));
      const repartoABeto = grupo.repartir("beto", dia(5));

      expect(() => {
        grupo.repartir("carla", dia(4));
      }).toThrow("El reparto no puede ser anterior al último reparto");
      expect(grupo.caja().montoPendienteDe("carla")).toBe(500);
      expect(grupo.caja().repartos()).toEqual([repartoABeto]);
    });

    it("no se puede repartir en una fecha anterior al último encuentro", () => {
      const grupo = nuevoGrupo();
      grupo.ingresar("ana", dia(1));
      grupo.ingresar("beto", dia(1));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));
      grupo.cobrar("ana", 1000, dia(3));
      grupo.registrarEncuentro(nuevoEncuentro({ numero: 9, asistentes: ["ana", "beto"] }));

      expect(() => {
        grupo.repartir("beto", dia(5));
      }).toThrow("El reparto no puede ser anterior al último encuentro");
      expect(grupo.caja().montoPendienteDe("beto")).toBe(1000);
      expect(grupo.caja().repartos()).toEqual([]);
    });
  });
});
