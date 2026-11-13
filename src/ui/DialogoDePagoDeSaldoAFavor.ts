import { monto } from "../app/Formato.ts";
import { Dialogo } from "./Dialogo.ts";
import { crear } from "./dom.ts";
import type { Entorno } from "./Entorno.ts";

export class DialogoDePagoDeSaldoAFavor extends Dialogo {
  constructor(entorno: Entorno, nombre: string) {
    const aPagar = monto(entorno.grupo().caja().saldoAFavorDe(nombre));
    super(
      entorno,
      `Pagarle a ${nombre} su saldo a favor`,
      [crear("p", {}, `Hay que pagarle ${aPagar}.`)],
      `Registrar pago de ${aPagar}`,
      () => entorno.aplicacion().pagar(nombre, entorno.ahora()),
    );
  }
}
