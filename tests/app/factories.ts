import { AlmacenamientoEnMemoria } from "../../src/app/AlmacenamientoEnMemoria.ts";
import { Aplicacion } from "../../src/app/Aplicacion.ts";
import { desempate, dia, reglas } from "../models/factories.ts";

export const ahora = () => dia(5);

export type Almacenamientos = { bitacora?: AlmacenamientoEnMemoria; planilla?: AlmacenamientoEnMemoria };

export const nuevaAplicacion = ({
  bitacora = new AlmacenamientoEnMemoria(),
  planilla = new AlmacenamientoEnMemoria(),
}: Almacenamientos = {}) => new Aplicacion(bitacora, desempate, planilla);

export const aplicacionConGrupo = (almacenamientos: Almacenamientos = {}) => {
  const aplicacion = nuevaAplicacion(almacenamientos);
  aplicacion.crearGrupo("Fútbol de los jueves", reglas());
  return aplicacion;
};

export const ingresarCobrandoLaGarantia = (aplicacion: Aplicacion, nombre: string, fecha: Date) => {
  aplicacion.ingresar(nombre, fecha);
  aplicacion.cobrarGarantia(nombre, fecha);
};
