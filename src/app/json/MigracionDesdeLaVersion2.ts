import { lista, objeto, type Objeto } from "./Campos.ts";

const conDesentrada = (json: unknown): Objeto => {
  const { garantia, ...reglas } = objeto(json, "Las reglas");
  return { ...reglas, desentrada: garantia };
};

const migrarComando = (json: unknown): Objeto[] => {
  const comando = objeto(json, "El comando");
  switch (comando.tipo) {
    case "crear grupo":
    case "cambiar reglas":
      return [{ ...comando, reglas: conDesentrada(comando.reglas) }];
    case "repartir":
      return [{ ...comando, tipo: "pagar" }];
    case "ingresar":
      return [comando, { tipo: "cobrar garantía", nombre: comando.nombre, fecha: comando.fecha }];
    case "ingresar sin pagar":
      return [{ ...comando, tipo: "ingresar" }];
    default:
      return [comando];
  }
};

export const migrarDesdeLaVersion2 = (bitacora: Objeto): { version: 3; comandos: Objeto[] } => ({
  version: 3,
  comandos: lista(bitacora, "comandos").flatMap(migrarComando),
});
