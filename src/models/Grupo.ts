import { Caja } from "./Caja.ts";
import { Cobro } from "./Cobro.ts";
import { Credito } from "./Credito.ts";
import type { Desempate } from "./Desempate.ts";
import type { Encuentro } from "./Encuentro.ts";
import type { Reglas } from "./Reglas.ts";
import type { Reparto } from "./Reparto.ts";
import { Participante } from "./Participante.ts";
import { Saldo } from "./Saldo.ts";
import type { Situacion } from "./estados/Estado.ts";

export class Grupo {
  private _nombre: string;
  private _historialDeReglas: Reglas[];
  private _encuentros: Encuentro[];
  private _participantes: Participante[];
  private _caja: Caja;

  constructor(nombre: string, reglasIniciales: Reglas, desempate: Desempate) {
    const nombreLimpio = nombre.trim();
    if (nombreLimpio === "") throw new Error("El nombre del grupo no puede estar vacío");

    this._nombre = nombreLimpio;
    this._historialDeReglas = [reglasIniciales];
    this._encuentros = [];
    this._participantes = [];
    this._caja = new Caja(desempate);
  }

  nombre(): string {
    return this._nombre;
  }

  cambiarReglas(reglas: Reglas): void {
    this._asertarQueNoEsAnteriorAlUltimoMovimiento("El cambio de reglas", reglas.rigeDesde());

    this._historialDeReglas.push(reglas);
    this._devolverLosExcedentesDeGarantia(reglas);
  }

  reglas(): Reglas {
    return this._historialDeReglas.at(-1)!;
  }

  historialDeReglas(): readonly Reglas[] {
    return this._historialDeReglas;
  }

  reglasAnteriores(): readonly Reglas[] {
    return this._historialDeReglas.slice(0, -1);
  }

  ingresar(nombre: string, fecha: Date): Participante {
    const nombreLimpio = nombre.trim();
    if (nombreLimpio === "") throw new Error("El nombre no puede estar vacío");
    if (this.participante(nombreLimpio) !== undefined) throw new Error(`${nombreLimpio} ya está en el grupo`);
    this._asertarQueNoEsAnteriorAlUltimoMovimiento("El ingreso", fecha);

    const garantia = this.reglas().garantia();
    const participante = new Participante(nombreLimpio, fecha, garantia);
    this._participantes.push(participante);
    this._caja.cobrar(Cobro.alIngresar(nombreLimpio, garantia, fecha));
    return participante;
  }

  cobrarGarantia(nombre: string, fecha: Date): void {
    const participante = this._participanteLlamado(nombre.trim());
    this._asertarQueNoEsAnteriorAlUltimoMovimiento("El cobro de la garantía", fecha);

    const monto = this.garantiaPorCobrarA(participante);
    participante.cobrarGarantia(fecha, this.reglas().garantia());
    this._caja.cobrar(Cobro.deGarantia(participante.nombre(), monto, fecha));
  }

  repartir(nombre: string, fecha: Date): Reparto {
    this._asertarQueNoEsAnteriorAlUltimoMovimiento("El reparto", fecha);

    return this._caja.repartir(nombre, fecha);
  }

  registrarEncuentro(encuentro: Encuentro): void {
    this._asertarQueEsPosteriorAlUltimoEncuentro(encuentro);
    this._asertarQueNoEsAnteriorAlUltimoMovimiento("El encuentro", encuentro.fecha());
    this._asertarQuePuedenAsistir(encuentro);
    this._asertarQuePuedenFaltar(encuentro);

    this._participantesLlamados(encuentro.asistentes()).forEach((participante) => participante.voy(encuentro));
    this._participantesLlamados(encuentro.ausentes()).forEach((participante) =>
      this._caja.distribuir(participante.falto(encuentro)),
    );
    this._encuentros.push(encuentro);
  }

  encuentros(): readonly Encuentro[] {
    return this._encuentros;
  }

  caja(): Caja {
    return this._caja;
  }

  participantes(): readonly Participante[] {
    return this._participantes;
  }

  posiblesAsistentes(): readonly Participante[] {
    return this._participantes.filter((participante) => this._esPosibleAsistente(participante));
  }

  quienesYaNoParticipan(): readonly Participante[] {
    return this._participantes.filter((participante) => !this._esPosibleAsistente(participante));
  }

  puedeAsistir(participante: Participante): boolean {
    return participante.puedeAsistir(this.reglas().garantia());
  }

  situacionDe(participante: Participante): Situacion {
    return participante.situacion(this.reglas().garantia());
  }

  garantiaPorCobrarA(participante: Participante): number {
    return participante.garantiaPorCobrar(this.reglas().garantia());
  }

  saldos(): readonly Saldo[] {
    const deudas = this._participantes
      .map((participante) => new Saldo(participante.nombre(), participante.saldoDeGarantia(this.reglas().garantia())))
      .filter((saldo) => saldo.monto() < 0);
    const creditos = this._caja
      .nombresConCreditosPendientes()
      .map((nombre) => new Saldo(nombre, this._caja.montoPendienteDe(nombre)));
    return [...deudas, ...creditos];
  }

  efectosDeCambiarLasReglas(reglas: Reglas): readonly Saldo[] {
    return this._participantes.flatMap((participante) => {
      const nuevoSaldo = participante.saldoDeGarantia(reglas.garantia());
      const cambia = nuevoSaldo !== 0 && nuevoSaldo !== participante.saldoDeGarantia(this.reglas().garantia());
      return cambia ? [new Saldo(participante.nombre(), nuevoSaldo)] : [];
    });
  }

  participante(nombre: string): Participante | undefined {
    return this._participantes.find((participante) => participante.nombre() === nombre);
  }

  private _devolverLosExcedentesDeGarantia(reglas: Reglas): void {
    for (const participante of this._participantes) {
      const excedente = participante.bajarGarantia(reglas.rigeDesde(), reglas.garantia());
      if (excedente > 0) this._caja.acreditar(new Credito(participante.nombre(), excedente));
    }
  }

  private _participantesLlamados(nombres: Iterable<string>): readonly Participante[] {
    return [...nombres].map((nombre) => this._participanteLlamado(nombre));
  }

  private _participanteLlamado(nombre: string): Participante {
    const participante = this.participante(nombre);
    if (participante === undefined) throw new Error(`${nombre} no es participante del grupo`);

    return participante;
  }

  private _esPosibleAsistente(participante: Participante): boolean {
    return !this.reglas().superaLaTolerancia(participante.faltas());
  }

  private _asertarQuePuedenAsistir(encuentro: Encuentro): void {
    for (const nombre of encuentro.asistentes()) {
      const participante = this._participanteLlamado(nombre);
      if (!this.puedeAsistir(participante)) throw new Error(`${nombre} no puede asistir`);
    }
  }

  // Quien superó la tolerancia no queda ausente, así sus faltas seguidas no pasan de la tolerancia más una.
  private _asertarQuePuedenFaltar(encuentro: Encuentro): void {
    for (const nombre of encuentro.ausentes()) {
      const participante = this._participanteLlamado(nombre);
      if (!this._esPosibleAsistente(participante)) throw new Error(`${nombre} no puede faltar`);
    }
  }

  private _asertarQueEsPosteriorAlUltimoEncuentro(encuentro: Encuentro): void {
    if (!this._esPosteriorAlUltimoEncuentro(encuentro.fecha())) {
      throw new Error("El encuentro debe ser posterior al último registrado");
    }
  }

  private _asertarQueNoEsAnteriorAlUltimoMovimiento(movimiento: string, fecha: Date): void {
    if (this._huboEncuentrosDespuesDe(fecha)) {
      throw new Error(`${movimiento} no puede ser anterior al último encuentro`);
    }
    const posterior = this._caja.movimientoPosteriorA(fecha);
    if (posterior !== undefined) {
      throw new Error(`${movimiento} no puede ser anterior al ${posterior.describir()}`);
    }
    if (fecha < this.reglas().rigeDesde()) {
      throw new Error(`${movimiento} no puede ser anterior ${this._origenDeLasReglas()}`);
    }
  }

  private _origenDeLasReglas(): string {
    return this.reglasAnteriores().length === 0 ? "a la creación del grupo" : "al último cambio de reglas";
  }

  private _esPosteriorAlUltimoEncuentro(fecha: Date): boolean {
    return this._encuentros.every((encuentro) => encuentro.fecha() < fecha);
  }

  private _huboEncuentrosDespuesDe(fecha: Date): boolean {
    return this._encuentros.some((encuentro) => encuentro.fecha() > fecha);
  }
}
