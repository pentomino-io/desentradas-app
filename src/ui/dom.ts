type Atributos = Record<string, string | number | boolean | EventListener | undefined>;

// Un hijo en false o undefined no se agrega, para poder escribir `condicion && elemento`.
export type Hijo = Node | string | false | undefined;

export const crear = <Etiqueta extends keyof HTMLElementTagNameMap>(
  etiqueta: Etiqueta,
  atributos: Atributos = {},
  ...hijos: Hijo[]
): HTMLElementTagNameMap[Etiqueta] => {
  const elemento = document.createElement(etiqueta);
  for (const [nombre, valor] of Object.entries(atributos)) {
    if (valor === undefined || valor === false) continue;

    if (typeof valor === "function") {
      elemento.addEventListener(nombre.replace(/^on/, ""), valor);
    } else {
      elemento.setAttribute(nombre, valor === true ? "" : String(valor));
    }
  }
  anexar(elemento, ...hijos);
  return elemento;
};

const anexar = (elemento: HTMLElement, ...hijos: Hijo[]): void => {
  elemento.append(...hijos.filter((hijo) => hijo !== false && hijo !== undefined));
};

export const boton = (texto: string, alHacerClic: () => void): HTMLButtonElement =>
  crear("button", { type: "button", onclick: alHacerClic }, texto);

export const botonDeEnvio = (texto: string): HTMLButtonElement => crear("button", { type: "submit" }, texto);

export const formulario = (alEnviar: (formulario: HTMLFormElement) => void, ...hijos: Hijo[]): HTMLFormElement => {
  const elemento = crear(
    "form",
    {
      onsubmit: (evento: Event) => {
        evento.preventDefault();
        alEnviar(elemento);
      },
    },
    ...hijos,
  );
  return elemento;
};

// Va envuelta para que, si es más ancha que la pantalla, se desplace sola.
export const tabla = (
  titulo: string | undefined,
  encabezados: readonly string[],
  filas: HTMLTableRowElement[],
  pie?: HTMLElement,
): HTMLElement | undefined =>
  filas.length === 0
    ? undefined
    : crear(
        "div",
        {},
        crear(
          "table",
          {},
          titulo !== undefined && crear("caption", {}, titulo),
          crear("thead", {}, crear("tr", {}, ...encabezados.map((texto) => crear("th", {}, texto)))),
          crear("tbody", {}, ...filas),
          pie !== undefined && crear("tfoot", {}, crear("tr", {}, crear("td", { colspan: encabezados.length }, pie))),
        ),
      );

export const tablaOAviso = (
  titulo: string | undefined,
  encabezados: readonly string[],
  filas: HTMLTableRowElement[],
  aviso: string,
  pie?: HTMLElement,
): Hijo[] => {
  const elemento = tabla(titulo, encabezados, filas, pie);
  return elemento !== undefined ? [elemento] : [crear("p", {}, aviso), pie !== undefined && crear("p", {}, pie)];
};

export const desplegable = (titulo: string, contenido: HTMLElement | undefined): HTMLElement | undefined =>
  contenido && crear("details", {}, crear("summary", {}, titulo), contenido);

export const fila = (...celdas: Hijo[]): HTMLTableRowElement =>
  crear("tr", {}, ...celdas.map((celda) => crear("td", {}, celda)));

export const mostrarDialogo = (contenedor: HTMLElement, ...contenido: Hijo[]): HTMLDialogElement => {
  const dialogo = crear("dialog", { onclose: () => dialogo.remove() }, ...contenido);
  contenedor.append(dialogo);
  dialogo.showModal();
  return dialogo;
};

export const descargar = (nombreDelArchivo: string, contenido: string, tipo: string): void => {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const enlace = crear("a", { href: url, download: nombreDelArchivo });
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
};

export const alerta = (): HTMLOutputElement => crear("output", { role: "alert" });

export const intentar = (accion: () => void, alerta: HTMLOutputElement): boolean => {
  try {
    alerta.textContent = "";
    accion();
    return true;
  } catch (error) {
    alerta.textContent = error instanceof Error ? error.message : String(error);
    return false;
  }
};

export const valorDe = (formulario: HTMLFormElement, nombre: string): string => {
  const control = formulario.elements.namedItem(nombre);
  if (!(control instanceof HTMLInputElement)) {
    throw new Error(`El formulario no tiene el campo "${nombre}"`);
  }

  return control.value;
};

export const numeroDe = (formulario: HTMLFormElement, nombre: string): number => {
  const valor = valorDe(formulario, nombre);
  const numero = Number(valor);
  if (valor.trim() === "" || Number.isNaN(numero)) throw new Error("Falta un número");

  return numero;
};
