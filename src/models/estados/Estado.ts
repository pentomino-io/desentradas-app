import { TransicionInvalida } from "./TransicionInvalida.ts";

export type NombreDeEstado = "participando" | "inactivo";

export abstract class Estado {
  abstract nombre(): NombreDeEstado;

  voy(): Estado {
    throw new TransicionInvalida("ir", this.nombre());
  }

  abstract falto(): Estado;

  cobrarGarantia(_garantia: number): Estado {
    throw new TransicionInvalida("cobrar la garantía", this.nombre());
  }

  bajarGarantia(_garantia: number): Estado {
    return this;
  }

  puedeAsistir(_garantiaVigente: number): boolean {
    return false;
  }

  garantia(): number {
    return 0;
  }

  faltas(): number {
    return 0;
  }
}
