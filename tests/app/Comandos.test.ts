import { describe, expect, it } from "vitest";
import { CrearGrupo } from "../../src/app/comandos/CrearGrupo.ts";
import { Ingresar } from "../../src/app/comandos/Ingresar.ts";
import { CobrarGarantia } from "../../src/app/comandos/CobrarGarantia.ts";
import { RegistrarEncuentro } from "../../src/app/comandos/RegistrarEncuentro.ts";
import { Repartir } from "../../src/app/comandos/Repartir.ts";
import { CambiarReglas } from "../../src/app/comandos/CambiarReglas.ts";
import { comandoDesdeJson } from "../../src/app/json/ComandoJson.ts";
import { reglasAJson } from "../../src/app/json/ReglasJson.ts";
import { desempate, dia, nuevoEncuentro, nuevoGrupo, reglas } from "../models/factories.ts";

const grupoConAnaInactiva = () => {
  const grupo = nuevoGrupo();
  grupo.ingresar("ana", dia(1));
  grupo.ingresar("beto", dia(1));
  grupo.registrarEncuentro(nuevoEncuentro({ numero: 2, asistentes: ["beto"], ausentes: ["ana"] }));
  return grupo;
};

describe("CrearGrupo", () => {
  it("crea el grupo con su nombre y sus reglas iniciales", () => {
    const reglasIniciales = reglas();
    const comando = new CrearGrupo("Fútbol de los jueves", reglasIniciales);

    const grupo = comando.ejecutar(undefined, desempate);

    expect(grupo.nombre()).toBe("Fútbol de los jueves");
    expect(grupo.reglas()).toBe(reglasIniciales);
    expect(grupo.participantes()).toEqual([]);
  });

  it("se convierte a JSON con el nombre del grupo y las reglas, y vuelve igual", () => {
    const comando = new CrearGrupo("Fútbol de los jueves", reglas());

    const json = comando.aJson();

    expect(json).toEqual({
      tipo: "crear grupo",
      nombreDelGrupo: "Fútbol de los jueves",
      reglas: reglasAJson(reglas()),
    });
    expect(comandoDesdeJson(json).aJson()).toEqual(json);
  });

  it("recuerda el nombre del grupo sin los espacios de los extremos, tanto al describirse como en JSON", () => {
    const comando = new CrearGrupo(" Fútbol de los jueves  ", reglas());

    const descripcion = comando.describir();
    const json = comando.aJson();

    expect(descripcion).toBe('Se creó el grupo "Fútbol de los jueves"');
    expect(json).toEqual({
      tipo: "crear grupo",
      nombreDelGrupo: "Fútbol de los jueves",
      reglas: reglasAJson(reglas()),
    });
  });

  it("conoce el nombre del grupo y las reglas iniciales, para poder volver a pedirlos si se deshace", () => {
    const reglasIniciales = reglas();
    const comando = new CrearGrupo("Fútbol de los jueves", reglasIniciales);

    expect(comando.nombreDelGrupo()).toBe("Fútbol de los jueves");
    expect(comando.reglas()).toBe(reglasIniciales);
  });

  it("no tiene asistencia, porque no es el registro de un encuentro", () => {
    const comando = new CrearGrupo("Fútbol de los jueves", reglas());

    const asistencia = comando.asistencia();

    expect(asistencia).toBeUndefined();
  });

  it("no se puede crear un grupo con el nombre vacío", () => {
    const comando = new CrearGrupo("   ", reglas());

    expect(() => {
      comando.ejecutar(undefined, desempate);
    }).toThrow("El nombre del grupo no puede estar vacío");
  });

  it("no se puede crear el grupo si ya fue creado", () => {
    const grupo = nuevoGrupo();
    const comando = new CrearGrupo("Fútbol de los jueves", reglas());

    expect(() => {
      comando.ejecutar(grupo, desempate);
    }).toThrow("El grupo ya fue creado");
  });
});

describe("ComandoSobreElGrupo", () => {
  it("ejecutarlo sobre el grupo creado lo modifica sin reemplazarlo", () => {
    const grupo = nuevoGrupo();
    const comando = new Ingresar("ana", dia(1));

    const resultado = comando.ejecutar(grupo, desempate);

    expect(resultado).toBe(grupo);
    expect(grupo.participante("ana")).toBeDefined();
  });

  it("no tiene asistencia salvo que sea el registro de un encuentro", () => {
    const comando = new Ingresar("ana", dia(1));

    const asistencia = comando.asistencia();

    expect(asistencia).toBeUndefined();
  });

  it("no se puede ejecutar antes de crear el grupo", () => {
    const comando = new Ingresar("ana", dia(1));

    expect(() => {
      comando.ejecutar(undefined, desempate);
    }).toThrow("El grupo no está creado");
  });
});

describe("Ingresar", () => {
  it("deja a la persona como participante del grupo desde la fecha indicada", () => {
    const grupo = nuevoGrupo();
    const comando = new Ingresar("ana", dia(1));

    comando.ejecutar(grupo, desempate);

    const ana = grupo.participante("ana");
    expect(ana?.historial().at(0)?.fecha()).toEqual(dia(1));
  });

  it("se convierte a JSON con el nombre y la fecha en formato ISO, y vuelve igual", () => {
    const comando = new Ingresar("ana", dia(1));

    const json = comando.aJson();

    expect(json).toEqual({ tipo: "ingresar", nombre: "ana", fecha: dia(1).toISOString() });
    expect(comandoDesdeJson(json).aJson()).toEqual(json);
  });

  it("recuerda el nombre sin los espacios de los extremos, tanto al describirse como en JSON", () => {
    const comando = new Ingresar("  ana ", dia(1));

    const descripcion = comando.describir();
    const json = comando.aJson();

    expect(descripcion).toBe("Ingresó ana");
    expect(json).toEqual({ tipo: "ingresar", nombre: "ana", fecha: dia(1).toISOString() });
  });
});

describe("CobrarGarantia", () => {
  it("le cobra la garantía a la persona en la fecha indicada", () => {
    const grupo = grupoConAnaInactiva();
    const comando = new CobrarGarantia("ana", dia(3));

    comando.ejecutar(grupo, desempate);

    expect(grupo.participante("ana")?.estado()).toBe("participando");
    expect(grupo.participante("ana")?.fechaDelUltimoCambio()).toEqual(dia(3));
  });

  it("se convierte a JSON con el nombre y la fecha en formato ISO, y vuelve igual", () => {
    const comando = new CobrarGarantia("ana", dia(3));

    const json = comando.aJson();

    expect(json).toEqual({ tipo: "cobrar garantía", nombre: "ana", fecha: dia(3).toISOString() });
    expect(comandoDesdeJson(json).aJson()).toEqual(json);
  });

  it("recuerda el nombre sin los espacios de los extremos, tanto al describirse como en JSON", () => {
    const comando = new CobrarGarantia(" ana  ", dia(3));

    const descripcion = comando.describir();
    const json = comando.aJson();

    expect(descripcion).toBe("Se cobró la garantía a ana");
    expect(json).toEqual({ tipo: "cobrar garantía", nombre: "ana", fecha: dia(3).toISOString() });
  });
});

describe("RegistrarEncuentro", () => {
  it("registra el encuentro en el grupo con su fecha, sus asistentes y sus ausentes", () => {
    const grupo = nuevoGrupo();
    grupo.ingresar("ana", dia(1));
    grupo.ingresar("beto", dia(1));
    const comando = new RegistrarEncuentro(dia(2), ["beto"], ["ana"]);

    comando.ejecutar(grupo, desempate);

    const [encuentro] = grupo.encuentros();
    expect(encuentro.fecha()).toEqual(dia(2));
    expect(encuentro.asistentes()).toEqual(new Set(["beto"]));
    expect(encuentro.ausentes()).toEqual(new Set(["ana"]));
    expect(grupo.participante("ana")?.estado()).toBe("inactivo");
  });

  it("recuerda la asistencia: quiénes vinieron y qué posibles asistentes no", () => {
    const comando = new RegistrarEncuentro(dia(2), ["beto"], ["ana", "carla"]);

    const asistencia = comando.asistencia();

    expect(asistencia).toEqual({ presentes: ["beto"], ausentes: ["ana", "carla"] });
  });

  it("se convierte a JSON con la fecha en formato ISO, los asistentes y los ausentes, y vuelve igual", () => {
    const comando = new RegistrarEncuentro(dia(2), ["beto", "carla"], ["ana"]);

    const json = comando.aJson();

    expect(json).toEqual({
      tipo: "registrar encuentro",
      fecha: dia(2).toISOString(),
      asistentes: ["beto", "carla"],
      ausentes: ["ana"],
    });
    expect(comandoDesdeJson(json).aJson()).toEqual(json);
  });
});

describe("Repartir", () => {
  it("entrega los créditos pendientes de la persona en la fecha indicada", () => {
    const grupo = grupoConAnaInactiva();
    const comando = new Repartir("beto", dia(4));

    comando.ejecutar(grupo, desempate);

    expect(grupo.caja().montoPendienteDe("beto")).toBe(0);
    const [reparto] = grupo.caja().repartos();
    expect(reparto.fecha()).toEqual(dia(4));
  });

  it("se convierte a JSON con el nombre y la fecha en formato ISO, y vuelve igual", () => {
    const comando = new Repartir("beto", dia(4));

    const json = comando.aJson();

    expect(json).toEqual({ tipo: "repartir", nombre: "beto", fecha: dia(4).toISOString() });
    expect(comandoDesdeJson(json).aJson()).toEqual(json);
  });
});

describe("CambiarReglas", () => {
  it("deja vigentes las nuevas reglas", () => {
    const grupo = nuevoGrupo();
    const nuevasReglas = reglas({ rigeDesde: dia(4) });
    const comando = new CambiarReglas(nuevasReglas);

    comando.ejecutar(grupo, desempate);

    expect(grupo.reglas()).toBe(nuevasReglas);
  });

  it("se convierte a JSON con las reglas y vuelve igual", () => {
    const nuevasReglas = reglas({ rigeDesde: dia(4) });
    const comando = new CambiarReglas(nuevasReglas);

    const json = comando.aJson();

    expect(json).toEqual({ tipo: "cambiar reglas", reglas: reglasAJson(nuevasReglas) });
    expect(comandoDesdeJson(json).aJson()).toEqual(json);
  });
});

describe("Comandos en JSON", () => {
  it("no se puede leer un comando de tipo desconocido", () => {
    expect(() => {
      comandoDesdeJson({ tipo: "expulsar", nombre: "ana" });
    }).toThrow('Formato inválido: comando desconocido "expulsar"');
  });

  it("no se puede leer un comando cuyo tipo es el nombre de algo que todo objeto hereda", () => {
    expect(() => {
      comandoDesdeJson({ tipo: "constructor" });
    }).toThrow('Formato inválido: comando desconocido "constructor"');
  });
});

describe("Descripción de los comandos", () => {
  it("crear grupo lleva la fecha desde la que rigen las reglas y se describe como que se creó el grupo con su nombre", () => {
    const comando = new CrearGrupo("Fútbol de los jueves", reglas({ rigeDesde: dia(1) }));

    expect(comando.fecha()).toEqual(dia(1));
    expect(comando.describir()).toBe('Se creó el grupo "Fútbol de los jueves"');
  });

  it("ingresar lleva la fecha de ingreso y se describe como que ingresó la persona", () => {
    const comando = new Ingresar("ana", dia(1));

    expect(comando.fecha()).toEqual(dia(1));
    expect(comando.describir()).toBe("Ingresó ana");
  });

  it("cobrar garantía lleva la fecha del cobro y se describe como que se le cobró la garantía a la persona", () => {
    const comando = new CobrarGarantia("ana", dia(3));

    expect(comando.fecha()).toEqual(dia(3));
    expect(comando.describir()).toBe("Se cobró la garantía a ana");
  });

  it("registrar encuentro lleva la fecha del encuentro y se describe como un encuentro con cuántos vinieron de los posibles asistentes", () => {
    const comando = new RegistrarEncuentro(dia(2), ["beto", "carla", "dani"], ["ana"]);

    expect(comando.fecha()).toEqual(dia(2));
    expect(comando.describir()).toBe("Encuentro con 3/4 presentes");
  });

  it("repartir lleva la fecha del reparto y se describe como que se le repartió a la persona", () => {
    const comando = new Repartir("beto", dia(4));

    expect(comando.fecha()).toEqual(dia(4));
    expect(comando.describir()).toBe("Se repartió a beto");
  });

  it("cambiar reglas lleva la fecha desde la que rigen las nuevas reglas y se describe como que se cambiaron las reglas, sin más datos", () => {
    const comando = new CambiarReglas(reglas({ rigeDesde: dia(4) }));

    expect(comando.fecha()).toEqual(dia(4));
    expect(comando.describir()).toBe("Se cambiaron las reglas");
  });
});
