import { describe, expect, it } from "vitest";
import { migrarDesdeLaVersion2 } from "../../src/app/json/MigracionDesdeLaVersion2.ts";
import { dia } from "../models/factories.ts";

const reglas = { rigeDesde: dia(1).toISOString(), toleranciaDeFaltas: 2 };

const migrarComando = (comando: object) => migrarDesdeLaVersion2({ version: 2, comandos: [comando] }).comandos;

describe("Migración desde la versión 2", () => {
  it("lleva la bitácora a la versión 3", () => {
    const migrada = migrarDesdeLaVersion2({ version: 2, comandos: [] });

    expect(migrada).toEqual({ version: 3, comandos: [] });
  });

  it("en las reglas con las que se crea el grupo, la garantía pasa a llamarse desentrada", () => {
    const comandos = migrarComando({
      tipo: "crear grupo",
      nombreDelGrupo: "Fútbol",
      reglas: { ...reglas, garantia: 1000 },
    });

    expect(comandos).toEqual([
      { tipo: "crear grupo", nombreDelGrupo: "Fútbol", reglas: { ...reglas, desentrada: 1000 } },
    ]);
  });

  it("en las reglas de un cambio de reglas, la garantía pasa a llamarse desentrada", () => {
    const comandos = migrarComando({ tipo: "cambiar reglas", reglas: { ...reglas, garantia: 1500 } });

    expect(comandos).toEqual([{ tipo: "cambiar reglas", reglas: { ...reglas, desentrada: 1500 } }]);
  });

  it("repartir pasa a llamarse pagar", () => {
    const comandos = migrarComando({ tipo: "repartir", nombre: "beto", fecha: dia(3).toISOString() });

    expect(comandos).toEqual([{ tipo: "pagar", nombre: "beto", fecha: dia(3).toISOString() }]);
  });

  it("los demás comandos quedan igual", () => {
    const ingresar = { tipo: "ingresar", nombre: "ana", fecha: dia(1).toISOString() };

    const comandos = migrarComando(ingresar);

    expect(comandos).toEqual([ingresar]);
  });
});
