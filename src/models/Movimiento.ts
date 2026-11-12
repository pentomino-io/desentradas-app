export type TipoDeMovimiento = "cobro" | "reparto";

// Plata que entra a la caja o sale de ella, con la persona que la dio o la recibió.
export interface Movimiento {
  fecha(): Date;
  tipo(): TipoDeMovimiento;
  persona(): string;
  monto(): number;
  describir(): string;
}
