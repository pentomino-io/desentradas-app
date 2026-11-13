import type { Encuentro } from "./Encuentro.ts";
import { Desentrada } from "./Desentrada.ts";
import type { Estado, NombreDeEstado, Situacion } from "./estados/Estado.ts";
import { Inactivo } from "./estados/Inactivo.ts";
import { Transicion, type Disparador } from "./Transicion.ts";

export class Participante {
  private _nombre: string;
  private _historial: Transicion[];

  constructor(nombre: string, fechaDeIngreso: Date) {
    this._nombre = nombre;
    this._historial = [new Transicion(fechaDeIngreso, "ingreso", new Inactivo(0))];
  }

  voy(encuentro: Encuentro): void {
    this._transicionar("voy", encuentro.fecha(), this._estado().voy());
  }

  falto(encuentro: Encuentro): Desentrada {
    const desentrada = new Desentrada(this._nombre, this.garantia(), encuentro);
    this._transicionar("falto", encuentro.fecha(), this._estado().falto());
    return desentrada;
  }

  cobrarGarantia(fecha: Date, garantia: number): void {
    this._transicionar("cobro de garantía", fecha, this._estado().cobrarGarantia(garantia));
  }

  bajarGarantia(fecha: Date, garantia: number): number {
    const excedente = Math.max(0, this.saldoDeGarantia(garantia));
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

  situacion(desentradaVigente: number): Situacion {
    return this._estado().situacion(desentradaVigente);
  }

  historial(): readonly Transicion[] {
    return this._historial;
  }

  fechaDeIngreso(): Date {
    return this._historial[0].fecha();
  }

  fechaDelUltimoCambio(): Date {
    return this._ultimaTransicion().fecha();
  }

  puedeAsistir(desentradaVigente: number): boolean {
    return this.garantiaPorCobrar(desentradaVigente) === 0;
  }

  saldoDeGarantia(desentradaVigente: number): number {
    return this._estado().saldoDeGarantia(desentradaVigente);
  }

  garantiaPorCobrar(desentradaVigente: number): number {
    return Math.max(0, desentradaVigente - this.garantia());
  }

  garantia(): number {
    return this._estado().garantia();
  }

  recienIngresado(): boolean {
    return this._historial.length === 1 && this.estado() === "inactivo";
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
