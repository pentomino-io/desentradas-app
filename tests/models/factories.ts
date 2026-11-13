import { Credito } from "../../src/models/Credito.ts";
import { DesempateAlfabetico } from "../../src/models/Desempate.ts";
import { Encuentro } from "../../src/models/Encuentro.ts";
import { Desentrada } from "../../src/models/Desentrada.ts";
import { Grupo } from "../../src/models/Grupo.ts";
import { Participante } from "../../src/models/Participante.ts";
import { Reglas } from "../../src/models/Reglas.ts";

export const dia = (numero: number) => new Date(`2026-09-${String(numero).padStart(2, "0")}T19:00:00`);

export const nuevoEncuentro = ({
  numero = 1,
  asistentes = ["otra persona"],
  ausentes = [],
}: { numero?: number; asistentes?: string[]; ausentes?: string[] } = {}) =>
  new Encuentro(dia(numero), asistentes, ausentes);

export const reglas = ({
  rigeDesde = dia(1),
  toleranciaDeFaltas = 2,
  desentrada = 1000,
}: {
  rigeDesde?: Date;
  toleranciaDeFaltas?: number;
  desentrada?: number;
} = {}) => new Reglas(rigeDesde, toleranciaDeFaltas, desentrada);

export const nuevoParticipante = (garantia = 1000) => Participante.pagando("ana", dia(1), garantia);

export const desempate = new DesempateAlfabetico();

export const nuevoGrupo = (reglasIniciales = reglas()) => new Grupo("Fútbol de los jueves", reglasIniciales, desempate);

export const desentrada = ({
  persona = "ana",
  monto = 1000,
  numero = 2,
  asistentes = ["beto", "carla"],
}: { persona?: string; monto?: number; numero?: number; asistentes?: string[] } = {}) =>
  new Desentrada(persona, monto, nuevoEncuentro({ numero, asistentes }));

export const nuevoCredito = ({ acreedor = "beto", monto = 500 }: { acreedor?: string; monto?: number } = {}) =>
  new Credito(acreedor, monto);
