import { crear } from "./dom.ts";

const campo = (etiqueta: string, control: HTMLElement, ayuda?: string): HTMLLabelElement =>
  crear("label", {}, `${etiqueta} `, control, ayuda !== undefined && crear("small", {}, ayuda));

export const casilla = (etiqueta: string, nombre: string, marcada: boolean): HTMLLabelElement =>
  crear("label", {}, crear("input", { type: "checkbox", name: nombre, checked: marcada }), ` ${etiqueta}`);

export const campoDeTexto = (etiqueta: string, nombre: string, valor = ""): HTMLLabelElement =>
  campo(etiqueta, crear("input", { type: "text", name: nombre, value: valor, required: true }));

export const campoNumerico = (
  etiqueta: string,
  nombre: string,
  valor: number,
  minimo: number,
  ayuda?: string,
): HTMLLabelElement =>
  campo(
    etiqueta,
    crear("input", { type: "number", name: nombre, value: valor, min: minimo, step: 1, required: true }),
    ayuda,
  );
