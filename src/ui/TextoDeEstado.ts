import type { Grupo } from "../models/Grupo.ts";
import type { Participante } from "../models/Participante.ts";

export const estadoDe = (grupo: Grupo, participante: Participante): string => {
  const situacion = grupo.situacionDe(participante);
  if (situacion !== "inactivo") return situacion;

  return `${situacion} (${participante.faltas()}/${grupo.reglas().toleranciaDeFaltas()} faltas)`;
};
