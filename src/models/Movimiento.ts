// Plata que entra a la caja o sale de ella, con la persona que la dio o la recibió.
export interface Movimiento {
  fecha(): Date;
  persona(): string;
  monto(): number;
  efectoEnCaja(): number;
  describir(): string;
}
