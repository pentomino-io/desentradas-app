import type { Encuentro } from "./Encuentro.ts";
import { GarantiaPerdida } from "./GarantiaPerdida.ts";
import type { Estado, NombreDeEstado, Situacion } from "./estados/Estado.ts";
import { Inactivo } from "./estados/Inactivo.ts";
import { Participando } from "./estados/Participando.ts";
import { Transicion, type Disparador } from "./Transicion.ts";

export class Participante {
  private _nombre: string;
  private _historial: Transicion[];

  static pagando(nombre: string, fechaDeIngreso: Date, garantia: number): Participante {
    return new Participante(nombre, fechaDeIngreso, new Participando(garantia));
  }

  static sinPagar(nombre: string, fechaDeIngreso: Date): Participante {
    return new Participante(nombre, fechaDeIngreso, new Inactivo(0));
  }

  private constructor(nombre: string, fechaDeIngreso: Date, estadoInicial: Estado) {
    this._nombre = nombre;
    this._historial = [new Transicion(fechaDeIngreso, "ingreso", estadoInicial)];
  }

  voy(encuentro: Encuentro): void {
    this._transicionar("voy", encuentro.fecha(), this._estado().voy());
  }

  falto(encuentro: Encuentro): GarantiaPerdida {
    const perdida = new GarantiaPerdida(this._nombre, this.garantia(), encuentro);
    this._transicionar("falto", encuentro.fecha(), this._estado().falto());
    return perdida;
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

  situacion(garantiaVigente: number): Situacion {
    return this._estado().situacion(garantiaVigente);
  }

  historial(): readonly Transicion[] {
    return this._historial;
  }

  fechaDelUltimoCambio(): Date {
    return this._ultimaTransicion().fecha();
  }

  puedeAsistir(garantiaVigente: number): boolean {
    return this.garantiaPorCobrar(garantiaVigente) === 0;
  }

  saldoDeGarantia(garantiaVigente: number): number {
    return this._estado().saldoDeGarantia(garantiaVigente);
  }

  garantiaPorCobrar(garantiaVigente: number): number {
    return Math.max(0, garantiaVigente - this.garantia());
  }

  garantia(): number {
    return this._estado().garantia();
  }

  recienIngresoSinPagar(): boolean {
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
