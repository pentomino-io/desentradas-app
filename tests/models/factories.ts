import { Cobro } from "../../src/models/Cobro.ts";
import { Credito } from "../../src/models/Credito.ts";
import { DesempateAlfabetico } from "../../src/models/Desempate.ts";
import { Encuentro } from "../../src/models/Encuentro.ts";
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
  montoPorFalta = 1000,
}: {
  rigeDesde?: Date;
  toleranciaDeFaltas?: number;
  montoPorFalta?: number;
} = {}) => new Reglas(rigeDesde, toleranciaDeFaltas, montoPorFalta);

export const nuevoParticipante = (reglasDeIngreso = reglas()) => new Participante("ana", dia(1), reglasDeIngreso);

export const desempate = new DesempateAlfabetico();

export const nuevoGrupo = (reglasIniciales = reglas()) => new Grupo("Fútbol de los jueves", reglasIniciales, desempate);

export const cobroEnEfectivo = ({
  deudor = "ana",
  monto = 1000,
  numero = 3,
  asistentes = ["beto", "carla"],
  encuentro = nuevoEncuentro({ numero: 2, asistentes }),
}: { deudor?: string; monto?: number; numero?: number; asistentes?: string[]; encuentro?: Encuentro } = {}) =>
  new Cobro(deudor, monto, dia(numero), encuentro, "efectivo");

export const nuevoCredito = ({ acreedor = "beto", monto = 500 }: { acreedor?: string; monto?: number } = {}) =>
  new Credito(acreedor, monto);
