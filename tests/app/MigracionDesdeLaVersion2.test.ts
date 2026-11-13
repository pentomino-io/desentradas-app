import { describe, expect, it } from "vitest";
import { Bitacora } from "../../src/app/Bitacora.ts";
import { migrarDesdeLaVersion2 } from "../../src/app/json/MigracionDesdeLaVersion2.ts";
import { desempate, dia } from "../models/factories.ts";

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

  it("«repartir» pasa a llamarse «pagar»", () => {
    const comandos = migrarComando({ tipo: "repartir", nombre: "beto", fecha: dia(3).toISOString() });

    expect(comandos).toEqual([{ tipo: "pagar", nombre: "beto", fecha: dia(3).toISOString() }]);
  });

  it("«ingresar» de la versión 2 pasa a ser «ingresar» y «cobrar garantía» en la misma fecha", () => {
    const comandos = migrarComando({ tipo: "ingresar", nombre: "ana", fecha: dia(1).toISOString() });

    expect(comandos).toEqual([
      { tipo: "ingresar", nombre: "ana", fecha: dia(1).toISOString() },
      { tipo: "cobrar garantía", nombre: "ana", fecha: dia(1).toISOString() },
    ]);
  });

  it("quien ingresó en la versión 2 queda participando con la garantía de la desentrada vigente, cobrada en efectivo al ingresar", () => {
    const bitacora = Bitacora.desdeJson(
      {
        version: 2,
        comandos: [
          { tipo: "crear grupo", nombreDelGrupo: "Fútbol", reglas: { ...reglas, garantia: 1000 } },
          { tipo: "cambiar reglas", reglas: { ...reglas, rigeDesde: dia(2).toISOString(), garantia: 1500 } },
          { tipo: "ingresar", nombre: "ana", fecha: dia(3).toISOString() },
        ],
      },
      desempate,
    );

    const grupo = bitacora.grupo();
    expect(grupo.participante("ana")?.estado()).toBe("participando");
    expect(grupo.participante("ana")?.garantia()).toBe(1500);
    expect(
      grupo
        .caja()
        .movimientos()
        .map((movimiento) => [movimiento.fecha(), movimiento.monto()]),
    ).toEqual([[dia(3), 1500]]);
  });

  it("«ingresar sin pagar» pasa a llamarse «ingresar»", () => {
    const comandos = migrarComando({ tipo: "ingresar sin pagar", nombre: "ana", fecha: dia(1).toISOString() });

    expect(comandos).toEqual([{ tipo: "ingresar", nombre: "ana", fecha: dia(1).toISOString() }]);
  });

  it("los demás comandos quedan igual", () => {
    const cobrar = { tipo: "cobrar garantía", nombre: "ana", fecha: dia(1).toISOString() };

    const comandos = migrarComando(cobrar);

    expect(comandos).toEqual([cobrar]);
  });
});
