import type { Encuentro } from "./Encuentro.ts";
import { GarantiaPerdida } from "./GarantiaPerdida.ts";
import type { Estado, NombreDeEstado } from "./estados/Estado.ts";
import { Participando } from "./estados/Participando.ts";
import { Transicion, type Disparador } from "./Transicion.ts";

export class Participante {
  private _nombre: string;
  private _historial: Transicion[];

  constructor(nombre: string, fechaDeIngreso: Date, garantia: number) {
    this._nombre = nombre;
    this._historial = [new Transicion(fechaDeIngreso, "ingreso", new Participando(garantia))];
  }

  voy(encuentro: Encuentro): void {
    this._transicionar("voy", encuentro.fecha(), this._estado().voy());
  }

  falto(encuentro: Encuentro): GarantiaPerdida | undefined {
    const garantia = this.garantia();
    this._transicionar("falto", encuentro.fecha(), this._estado().falto());
    if (garantia === 0) return undefined;

    return new GarantiaPerdida(this._nombre, garantia, encuentro);
  }

  cobrarGarantia(fecha: Date, garantia: number): void {
    this._transicionar("cobro de garantía", fecha, this._estado().cobrarGarantia(garantia));
  }

  bajarGarantia(fecha: Date, garantia: number): number {
    const excedente = Math.max(0, this.garantia() - garantia);
    if (excedente === 0) return 0;

    this._transicionar("cambio de reglas", fecha, this._estado().bajarGarantia(garantia));
    return excedente;
  }

  nombre(): string {
    return this._nombre;
  }

  estado(): NombreDeEstado {
    return this._estado().nombre();
  }

  historial(): readonly Transicion[] {
    return this._historial;
  }

  fechaDelUltimoCambio(): Date {
    return this._ultimaTransicion().fecha();
  }

  puedeAsistir(): boolean {
    return this._estado().puedeAsistir();
  }

  garantia(): number {
    return this._estado().garantia();
  }

  faltas(): number {
    return this._estado().faltas();
  }

  private _transicionar(disparador: Disparador, fecha: Date, nuevoEstado: Estado): void {
    this._historial.push(new Transicion(fecha, disparador, nuevoEstado));
  }

  private _estado(): Estado {
    return this._ultimaTransicion().hacia();
  }

  private _ultimaTransicion(): Transicion {
    return this._historial.at(-1)!;
  }
}
