import { crear } from "./dom.ts";

const campo = (etiqueta: string, control: HTMLElement): HTMLLabelElement => crear("label", {}, `${etiqueta} `, control);

export const campoDeTexto = (etiqueta: string, nombre: string, valor = ""): HTMLLabelElement =>
  campo(etiqueta, crear("input", { type: "text", name: nombre, value: valor, required: true }));

export const campoNumerico = (etiqueta: string, nombre: string, valor: number, minimo: number): HTMLLabelElement =>
  campo(etiqueta, crear("input", { type: "number", name: nombre, value: valor, min: minimo, step: 1, required: true }));
