import type { GarantiaPerdida } from "./GarantiaPerdida.ts";

// Los primeros reciben un peso más del sobrante de la garantía perdida.
export interface Desempate {
  ordenar(nombres: Iterable<string>, garantiaPerdida: GarantiaPerdida): string[];
}

export class DesempateAlfabetico implements Desempate {
  ordenar(nombres: Iterable<string>, _garantiaPerdida: GarantiaPerdida): string[] {
    return [...nombres].sort();
  }
}

export class DesempateAleatorioReproducible implements Desempate {
  ordenar(nombres: Iterable<string>, garantiaPerdida: GarantiaPerdida): string[] {
    const datos = this._datosDe(garantiaPerdida);
    const puntajeDe = (nombre: string) => cyrb53(`${datos}|${nombre}`);
    return [...nombres].sort((uno, otro) => puntajeDe(uno) - puntajeDe(otro));
  }

  private _datosDe(garantiaPerdida: GarantiaPerdida): string {
    const encuentroFaltado = garantiaPerdida.encuentroFaltado();
    return [garantiaPerdida.persona(), encuentroFaltado.fecha().getTime(), garantiaPerdida.monto()].join("|");
  }
}

// Hash de 53 bits de un string.
const cyrb53 = (texto: string): number => {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < texto.length; i++) {
    const caracter = texto.charCodeAt(i);
    h1 = Math.imul(h1 ^ caracter, 2654435761);
    h2 = Math.imul(h2 ^ caracter, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};
