import { VersionAnterior, VersionPosterior } from "../app/Bitacora.ts";

export const explicacionDeLaImportacionFallida = (error: unknown): string => {
  if (error instanceof VersionAnterior) {
    return "Esta copia de seguridad es de una versión anterior de la app, sin garantías, y no se puede importar. No se cambió nada.";
  }
  if (error instanceof VersionPosterior) {
    return "Esta copia de seguridad es de una versión más nueva de la app. Recargá la página para actualizarla e intentá de nuevo. No se cambió nada.";
  }

  return "El archivo no es una copia de seguridad de Desentradas, o está dañado. No se cambió nada.";
};

export const explicacionDeLaCargaFallida = (error: Error): string =>
  error instanceof VersionAnterior
    ? "Los datos guardados son de una versión anterior de la app, sin garantías, y no se pueden usar. Creá el grupo de nuevo."
    : "Los datos guardados no se pudieron leer. Si tenés una copia de seguridad, importala; si no, creá el grupo de nuevo.";
