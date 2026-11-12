import { TransicionInvalida } from "./TransicionInvalida.ts";

export type NombreDeEstado = "participando" | "inactivo";

export type Situacion = NombreDeEstado | "garantía incompleta";

export abstract class Estado {
  abstract nombre(): NombreDeEstado;

  voy(): Estado {
    throw new TransicionInvalida("ir", this.nombre());
  }

  abstract situacion(garantiaVigente: number): Situacion;

  abstract falto(): Estado;

  cobrarGarantia(_garantia: number): Estado {
    throw new TransicionInvalida("cobrar la garantía", this.nombre());
  }

  bajarGarantia(_garantia: number): Estado {
    return this;
  }

  garantia(): number {
    return 0;
  }

  faltas(): number {
    return 0;
  }
}
