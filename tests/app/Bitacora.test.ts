import { describe, expect, it } from "vitest";
import { Bitacora, VersionAnterior, VersionPosterior } from "../../src/app/Bitacora.ts";
import { CrearGrupo } from "../../src/app/comandos/CrearGrupo.ts";
import { Ingresar } from "../../src/app/comandos/Ingresar.ts";
import { desempate, dia, reglas } from "../models/factories.ts";

const bitacoraConGrupo = (nombreDelGrupo = "Fútbol de los jueves", reglasIniciales = reglas()) => {
  const bitacora = new Bitacora(desempate);
  bitacora.ejecutar(new CrearGrupo(nombreDelGrupo, reglasIniciales));
  return bitacora;
};

describe("Bitacora", () => {
  describe("creación del grupo", () => {
    it("una bitácora nueva no tiene grupo", () => {
      const bitacora = new Bitacora(desempate);

      expect(bitacora.tieneGrupo()).toBe(false);
      expect(() => {
        bitacora.grupo();
      }).toThrow("El grupo no está creado");
    });

    it("ejecutar la creación del grupo deja el grupo creado con su nombre y sus reglas iniciales", () => {
      const bitacora = new Bitacora(desempate);
      const reglasIniciales = reglas();
      const crearGrupo = new CrearGrupo("Fútbol de los jueves", reglasIniciales);

      bitacora.ejecutar(crearGrupo);

      expect(bitacora.tieneGrupo()).toBe(true);
      expect(bitacora.grupo().nombre()).toBe("Fútbol de los jueves");
      expect(bitacora.grupo().reglas()).toBe(reglasIniciales);
      expect(bitacora.comandos()).toEqual([crearGrupo]);
    });
  });

  describe("comandos", () => {
    it("ejecutar un comando lo agrega a la bitácora y modifica el grupo", () => {
      const bitacora = bitacoraConGrupo();
      const ingresar = new Ingresar("ana", dia(1));

      bitacora.ejecutar(ingresar);

      expect(bitacora.comandos().at(-1)).toBe(ingresar);
      expect(bitacora.grupo().participante("ana")).toBeDefined();
    });

    it("un comando que el grupo rechaza no se agrega a la bitácora", () => {
      const bitacora = bitacoraConGrupo();
      bitacora.ejecutar(new Ingresar("ana", dia(1)));
      const comandosAntes = [...bitacora.comandos()];

      expect(() => {
        bitacora.ejecutar(new Ingresar("ana", dia(2)));
      }).toThrow("ana ya está en el grupo");
      expect(bitacora.comandos()).toEqual(comandosAntes);
    });
  });

  describe("deshacer", () => {
    it("deshacer deja el grupo como estaba antes del último comando", () => {
      const bitacora = bitacoraConGrupo();
      bitacora.ejecutar(new Ingresar("ana", dia(1)));
      bitacora.ejecutar(new Ingresar("beto", dia(1)));

      bitacora.deshacer();

      expect(bitacora.comandos()).toHaveLength(2);
      expect(bitacora.grupo().participante("ana")).toBeDefined();
      expect(bitacora.grupo().participante("beto")).toBeUndefined();
    });

    it("deshacer devuelve el comando deshecho", () => {
      const bitacora = bitacoraConGrupo();
      bitacora.ejecutar(new Ingresar("ana", dia(1)));
      const ingresarABeto = new Ingresar("beto", dia(1));
      bitacora.ejecutar(ingresarABeto);

      const deshecho = bitacora.deshacer();

      expect(deshecho).toBe(ingresarABeto);
    });

    it("deshacer la creación del grupo deja la bitácora sin grupo", () => {
      const bitacora = bitacoraConGrupo();

      bitacora.deshacer();

      expect(bitacora.tieneGrupo()).toBe(false);
      expect(bitacora.comandos()).toEqual([]);
    });

    it("no se puede deshacer en una bitácora vacía", () => {
      const bitacora = new Bitacora(desempate);

      expect(bitacora.puedeDeshacer()).toBe(false);
      expect(() => {
        bitacora.deshacer();
      }).toThrow("No hay nada que deshacer");
    });

    it("se puede deshacer mientras quede algún comando", () => {
      const bitacora = bitacoraConGrupo();

      expect(bitacora.puedeDeshacer()).toBe(true);
    });

    it("deshacer reconstruye el grupo desde cero, así que las referencias anteriores dejan de valer", () => {
      const bitacora = bitacoraConGrupo();
      bitacora.ejecutar(new Ingresar("ana", dia(1)));
      bitacora.ejecutar(new Ingresar("beto", dia(1)));
      const grupoAnterior = bitacora.grupo();
      const anaAnterior = grupoAnterior.participante("ana");

      bitacora.deshacer();

      expect(bitacora.grupo()).not.toBe(grupoAnterior);
      expect(bitacora.grupo().participante("ana")).not.toBe(anaAnterior);
    });
  });

  describe("JSON", () => {
    it("la bitácora se convierte a JSON con la versión del formato y sus comandos, y vuelve igual", () => {
      const bitacora = bitacoraConGrupo("Fútbol de los jueves");
      const ingresar = new Ingresar("ana", dia(1));
      bitacora.ejecutar(ingresar);

      const json = bitacora.aJson();
      const leida = Bitacora.desdeJson(json, desempate);

      expect(json).toEqual({
        version: 3,
        comandos: [new CrearGrupo("Fútbol de los jueves", reglas()).aJson(), ingresar.aJson()],
      });
      expect(leida.grupo().nombre()).toBe("Fútbol de los jueves");
      expect(leida.grupo().participante("ana")).toBeDefined();
      expect(leida.aJson()).toEqual(json);
    });

    it("una bitácora vacía se convierte a JSON sin comandos y vuelve vacía", () => {
      const bitacora = new Bitacora(desempate);

      const json = bitacora.aJson();
      const leida = Bitacora.desdeJson(json, desempate);

      expect(json).toEqual({ version: 3, comandos: [] });
      expect(leida.tieneGrupo()).toBe(false);
    });

    it("una bitácora de la versión 2 se lee como su equivalente de la versión 3", () => {
      const reglasDeLaVersion2 = { rigeDesde: dia(1).toISOString(), toleranciaDeFaltas: 2, garantia: 1500 };

      const leida = Bitacora.desdeJson(
        {
          version: 2,
          comandos: [{ tipo: "crear grupo", nombreDelGrupo: "Fútbol de los jueves", reglas: reglasDeLaVersion2 }],
        },
        desempate,
      );

      expect(leida.aJson()).toEqual({
        version: 3,
        comandos: [new CrearGrupo("Fútbol de los jueves", reglas({ desentrada: 1500 })).aJson()],
      });
    });

    it("no se puede leer una bitácora de una versión anterior", () => {
      expect(() => {
        Bitacora.desdeJson({ version: 1, comandos: [] }, desempate);
      }).toThrow(VersionAnterior);
    });

    it("no se puede leer una bitácora de una versión posterior", () => {
      expect(() => {
        Bitacora.desdeJson({ version: 4, comandos: [] }, desempate);
      }).toThrow(VersionPosterior);
    });

    it("no se puede leer una bitácora con un comando que el grupo rechaza", () => {
      const bitacora = bitacoraConGrupo();
      bitacora.ejecutar(new Ingresar("ana", dia(1)));
      const json = bitacora.aJson();
      json.comandos.push(new Ingresar("ana", dia(2)).aJson());

      expect(() => {
        Bitacora.desdeJson(json, desempate);
      }).toThrow("ana ya está en el grupo");
    });
  });
});
