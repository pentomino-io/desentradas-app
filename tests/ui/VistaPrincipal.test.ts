// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AlmacenamientoEnMemoria } from "../../src/app/AlmacenamientoEnMemoria.ts";
import type { Aplicacion } from "../../src/app/Aplicacion.ts";
import { fechaYHora } from "../../src/app/Formato.ts";
import { VistaPrincipal } from "../../src/ui/VistaPrincipal.ts";
import { ahora, aplicacionConGrupo, nuevaAplicacion } from "../app/factories.ts";
import { dia, reglas } from "../models/factories.ts";

const explicacionDeLaGarantia = "Se paga al ingresar; quien falta la pierde y se reparte entre quienes fueron.";

const nuevosAlmacenamientos = () => ({
  bitacora: new AlmacenamientoEnMemoria(),
  planilla: new AlmacenamientoEnMemoria(),
  pantalla: new AlmacenamientoEnMemoria(),
});

const almacenamientosConGrupoSinParticipantes = () => {
  const almacenamientos = nuevosAlmacenamientos();
  aplicacionConGrupo(almacenamientos);
  return almacenamientos;
};

const almacenamientosConAnaInactiva = () => {
  const almacenamientos = almacenamientosConGrupoSinParticipantes();
  const aplicacion = nuevaAplicacion(almacenamientos);
  ["ana", "beto", "carla", "dani"].forEach((nombre) => aplicacion.ingresar(nombre, dia(1)));
  aplicacion.registrarEncuentro(dia(2), ["beto", "carla", "dani"], ["ana"]);
  return almacenamientos;
};

const almacenamientosConAnaInactivaYUnaPlanillaCon = (presentes: string[]) => {
  const almacenamientos = almacenamientosConAnaInactiva();
  const planilla = nuevaAplicacion(almacenamientos).empezarPlanillaDeAsistencia();
  presentes.forEach((nombre) => planilla.marcarComoPresente(nombre));
  return almacenamientos;
};

const almacenamientosConGarantiasIncompletas = () => {
  const almacenamientos = almacenamientosConAnaInactiva();
  const aplicacion = nuevaAplicacion(almacenamientos);
  ["beto", "carla", "dani"].forEach((nombre) => aplicacion.repartir(nombre, dia(3)));
  aplicacion.cambiarReglas(reglas({ rigeDesde: dia(3), garantia: 1500 }));
  return almacenamientos;
};

const almacenamientosConAnaInactivaConCreditos = () => {
  const almacenamientos = almacenamientosConGrupoSinParticipantes();
  const aplicacion = nuevaAplicacion(almacenamientos);
  ["ana", "beto", "carla"].forEach((nombre) => aplicacion.ingresar(nombre, dia(1)));
  aplicacion.registrarEncuentro(dia(2), ["ana", "beto"], ["carla"]); // ana recibe 500
  aplicacion.registrarEncuentro(dia(3), ["beto"], ["ana"]);
  return almacenamientos;
};

const almacenamientosConAnaFueraDeLaTolerancia = () => {
  const almacenamientos = almacenamientosConAnaInactiva();
  const aplicacion = nuevaAplicacion(almacenamientos);
  aplicacion.registrarEncuentro(dia(3), ["beto", "carla", "dani"], ["ana"]);
  aplicacion.registrarEncuentro(dia(4), ["beto", "carla", "dani"], ["ana"]);
  return almacenamientos;
};

const montar = (almacenamientos = nuevosAlmacenamientos()) => {
  const aplicacion = nuevaAplicacion(almacenamientos);
  const raiz = document.body.appendChild(document.createElement("div"));
  new VistaPrincipal(aplicacion, almacenamientos.pantalla, ahora).montarEn(raiz);
  return { aplicacion, almacenamientos, raiz };
};

const recargar = (almacenamientos: ReturnType<typeof nuevosAlmacenamientos>) => {
  document.body.replaceChildren();
  return montar(almacenamientos);
};

const textoDe = (elemento: Element) => elemento.textContent?.replace(/\s+/g, " ").trim() ?? "";

const buscar = <T extends Element>(selector: string, coincide: (texto: string) => boolean, raiz: ParentNode) =>
  [...raiz.querySelectorAll<T>(selector)].find((elemento) => coincide(textoDe(elemento)));

const elementoConTexto = <T extends Element>(selector: string, texto: string, raiz: ParentNode = document): T => {
  const encontrado = buscar<T>(selector, (textoDelElemento) => textoDelElemento === texto, raiz);
  if (encontrado === undefined) throw new Error(`No se encontró <${selector}> con el texto "${texto}"`);

  return encontrado;
};

const hayElementoConTexto = (selector: string, texto: string, raiz: ParentNode = document) =>
  buscar(selector, (textoDelElemento) => textoDelElemento === texto, raiz) !== undefined;

const hacerClic = (textoDelBoton: string, raiz: ParentNode = document) =>
  elementoConTexto<HTMLButtonElement>("button", textoDelBoton, raiz).click();

const etiqueta = (texto: string, raiz: ParentNode = document) =>
  buscar<HTMLLabelElement>("label", (textoDeLaEtiqueta) => textoDeLaEtiqueta.startsWith(texto), raiz);

const hayEtiqueta = (texto: string, raiz: ParentNode = document) => etiqueta(texto, raiz) !== undefined;

const campo = (texto: string, raiz: ParentNode = document) => {
  const control = etiqueta(texto, raiz)?.control;
  if (control == null) throw new Error(`No se encontró el campo "${texto}"`);

  return control as HTMLInputElement;
};

const completar = (etiqueta: string, valor: string, raiz: ParentNode = document) => {
  const control = campo(etiqueta, raiz);
  control.value = valor;
  control.dispatchEvent(new Event("change", { bubbles: true }));
};

const exportar = async () => {
  const crearUrl = vi.spyOn(URL, "createObjectURL");
  const clic = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  try {
    hacerClic("Exportar");
    const [archivo] = crearUrl.mock.calls[0];
    return await (archivo as Blob).text();
  } finally {
    crearUrl.mockRestore();
    clic.mockRestore();
  }
};

const elegirArchivo = (etiqueta: string, contenido: string) => {
  const entrada = campo(etiqueta);
  const transferencia = new DataTransfer();
  transferencia.items.add(new File([contenido], "bitacora.json", { type: "application/json" }));
  entrada.files = transferencia.files;
  entrada.dispatchEvent(new Event("change", { bubbles: true }));
};

const nombresDeParticipantes = (aplicacion: Aplicacion) =>
  aplicacion
    .grupo()
    .participantes()
    .map((participante) => participante.nombre());

const pantallaActual = (raiz: ParentNode = document) => textoDe(raiz.querySelector("main h2")!);

const hayDesplegable = (titulo: string) => hayElementoConTexto("summary", titulo);

// El cambio de hash se avisa en una tarea aparte, como en el navegador.
const esperarElCambioDeHash = () => new Promise((resolver) => setTimeout(resolver, 0));

const navegarA = async (pestania: string) => {
  elementoConTexto<HTMLAnchorElement>("nav a", pestania).click();
  await esperarElCambioDeHash();
};

const textosDeLasCeldas = (fila: Element) => [...fila.querySelectorAll("td")].map(textoDe);

const fila = (nombre: string) => {
  const fila = [...document.querySelectorAll("tbody tr")].find((fila) => textosDeLasCeldas(fila).includes(nombre));
  if (fila === undefined) throw new Error(`No se encontró la fila de "${nombre}"`);

  return fila;
};

const casillaDeAsistencia = (nombre: string) => fila(nombre).querySelector<HTMLInputElement>("input[type=checkbox]")!;

const marcadosComoPresentes = (nombres: string[]) => nombres.filter((nombre) => casillaDeAsistencia(nombre).checked);

const hayDialogoAbierto = () => document.querySelector("dialog[open]") !== null;

const dialogoAbierto = () => {
  const dialogo = document.querySelector<HTMLDialogElement>("dialog[open]");
  if (dialogo === null) throw new Error("No hay un diálogo abierto");

  return dialogo;
};

const filasDe = (raiz: ParentNode) => [...raiz.querySelectorAll("tbody tr")].map(textosDeLasCeldas);

const filasDeActivos = () => filasDe(elementoConTexto("caption", "Participaciones activas").parentElement!);

const filasDeQuienesYaNoParticipan = () =>
  filasDe(elementoConTexto("summary", "Quienes ya no participan").parentElement!);

describe("VistaPrincipal", () => {
  beforeEach(() => {
    location.hash = "";
    document.body.replaceChildren();
  });

  it("las tablas sin filas no se muestran, ni el desplegable que las contiene, hasta que tienen algo que mostrar", async () => {
    const almacenamientos = almacenamientosConGrupoSinParticipantes();
    montar(almacenamientos);
    await navegarA("Participantes");
    expect(hayDesplegable("Quienes ya no participan")).toBe(false);
    await navegarA("Caja");
    expect(hayDesplegable("Movimientos")).toBe(false);
    await navegarA("Reglas");
    expect(hayDesplegable("Versiones anteriores")).toBe(false);

    const preparacion = nuevaAplicacion(almacenamientos);
    preparacion.ingresar("ana", dia(1));
    preparacion.ingresar("beto", dia(1));
    [2, 3, 4].forEach((numero) => preparacion.registrarEncuentro(dia(numero), ["beto"], ["ana"])); // ana supera la tolerancia
    recargar(almacenamientos);
    await navegarA("Participantes");
    expect(hayDesplegable("Quienes ya no participan")).toBe(true);
    expect(fila("ana")).toBeDefined();
    await navegarA("Caja");
    expect(hayDesplegable("Movimientos")).toBe(true);
  });

  it("una vista que ya no está en el documento deja de seguir la navegación", async () => {
    const { raiz } = montar(almacenamientosConAnaInactiva());
    document.body.replaceChildren();

    location.hash = "#caja";
    await esperarElCambioDeHash();

    expect(pantallaActual(raiz)).toBe("Encuentro");
  });

  describe("formulario inicial", () => {
    it("crear el grupo, con reglas que rigen desde el momento de crearlo, muestra su nombre y las pantallas", () => {
      const { aplicacion } = montar();
      expect(document.querySelector("nav")).toBeNull();
      expect(pantallaActual()).toBe("Crear el grupo");
      expect(hayEtiqueta("Rige desde")).toBe(false);

      completar("Nombre del grupo", "Fútbol de los jueves");
      completar("¿Cuántas faltas seguidas se toleran", "2");
      completar("¿Cuánto se paga de garantía?", "1000");
      hacerClic("Crear");

      expect(aplicacion.grupo().nombre()).toBe("Fútbol de los jueves");
      expect(aplicacion.grupo().reglas().toleranciaDeFaltas()).toBe(2);
      expect(aplicacion.grupo().reglas().garantia()).toBe(1000);
      expect(aplicacion.grupo().reglas().rigeDesde()).toEqual(ahora());
      expect(textoDe(document.querySelector("h1")!)).toBe("Fútbol de los jueves");
      expect([...document.querySelectorAll("nav a")].map(textoDe)).toEqual([
        "Participantes",
        "Caja",
        "Encuentro",
        "Historial",
        "Reglas",
      ]);
      expect(pantallaActual()).toBe("Encuentro");
    });

    it("el formulario inicial explica la garantía en su campo", () => {
      montar();

      const campoDeGarantia = etiqueta("¿Cuánto se paga de garantía?")!;

      expect(textoDe(campoDeGarantia)).toContain(explicacionDeLaGarantia);
    });

    it("deshacer la creación del grupo vuelve al formulario inicial con lo que se había cargado", async () => {
      const almacenamientos = nuevosAlmacenamientos();
      nuevaAplicacion(almacenamientos).crearGrupo(
        "Fútbol de los jueves",
        reglas({ toleranciaDeFaltas: 3, garantia: 1500 }),
      );
      const { aplicacion } = montar(almacenamientos);
      await navegarA("Historial");

      hacerClic("Deshacer");

      expect(aplicacion.tieneGrupo()).toBe(false);
      expect(pantallaActual()).toBe("Crear el grupo");
      expect(campo("Nombre del grupo").value).toBe("Fútbol de los jueves");
      expect(campo("¿Cuántas faltas seguidas se toleran").value).toBe("3");
      expect(campo("¿Cuánto se paga de garantía?").value).toBe("1500");
    });
  });

  describe("pantalla de participantes", () => {
    it("registrar un participante y reingresar a quien ya no participa se fechan en el momento en que se hacen", async () => {
      const { aplicacion } = montar(almacenamientosConAnaFueraDeLaTolerancia());
      await navegarA("Participantes");

      hacerClic("Registrar participante");
      expect(hayEtiqueta("Fecha", dialogoAbierto())).toBe(false);
      completar("Nombre", "gus", dialogoAbierto());
      hacerClic("Registrar", dialogoAbierto());
      hacerClic("Reingresar", fila("ana"));
      hacerClic("Cobrar", dialogoAbierto());

      expect(aplicacion.grupo().participante("gus")?.historial().at(0)?.fecha()).toEqual(ahora());
      expect(aplicacion.grupo().participante("ana")?.fechaDelUltimoCambio()).toEqual(ahora());
    });

    it("reingresar pide confirmar el cobro de la garantía, y después figura entre los activos", async () => {
      const { aplicacion } = montar(almacenamientosConAnaFueraDeLaTolerancia());
      await navegarA("Participantes");

      hacerClic("Reingresar", fila("ana"));
      expect(textoDe(dialogoAbierto())).toContain("Se le va a cobrar una garantía de $ 1.000.");
      hacerClic("Cobrar", dialogoAbierto());

      expect(aplicacion.grupo().participante("ana")?.estado()).toBe("participando");
      expect(filasDeActivos()).toContainEqual(["ana", "participando"]);
      expect(hayDesplegable("Quienes ya no participan")).toBe(false);
    });

    it("registrar un participante pide confirmar el cobro de la garantía, y después figura entre los activos", async () => {
      const { aplicacion } = montar(almacenamientosConGrupoSinParticipantes());
      await navegarA("Participantes");

      hacerClic("Registrar participante");
      expect(textoDe(dialogoAbierto())).toContain("Se le va a cobrar una garantía de $ 1.000.");
      completar("Nombre", "ana", dialogoAbierto());
      hacerClic("Registrar", dialogoAbierto());

      expect(aplicacion.grupo().participante("ana")?.garantia()).toBe(1000);
      expect(filasDeActivos()).toEqual([["ana", "participando"]]);
    });

    it("registrar el nombre de quien ya no participa pregunta si es la misma persona, y si lo es le cobra la garantía", async () => {
      const { aplicacion } = montar(almacenamientosConAnaFueraDeLaTolerancia());
      await navegarA("Participantes");
      hacerClic("Registrar participante");
      completar("Nombre", "ana", dialogoAbierto());

      hacerClic("Registrar", dialogoAbierto());
      expect(textoDe(dialogoAbierto())).toContain(
        "Ya hay alguien con el nombre ana. ¿Es la misma persona? En ese caso, se le cobra la garantía de $ 1.000.",
      );
      hacerClic("Sí", dialogoAbierto());

      expect(hayDialogoAbierto()).toBe(false);
      expect(nombresDeParticipantes(aplicacion)).toEqual(["ana", "beto", "carla", "dani"]);
      expect(aplicacion.grupo().participante("ana")?.estado()).toBe("participando");
    });

    it("registrar el nombre de un inactivo con créditos pendientes avisa qué parte de la garantía cubren", async () => {
      montar(almacenamientosConAnaInactivaConCreditos());
      await navegarA("Participantes");
      hacerClic("Registrar participante");
      completar("Nombre", "ana", dialogoAbierto());

      hacerClic("Registrar", dialogoAbierto());

      expect(textoDe(dialogoAbierto())).toContain(
        "En ese caso, se le cobra la garantía de $ 1.000 ($ 500 de créditos, $ 500 en efectivo).",
      );
    });

    it("registrar el nombre de quien ya no participa, si es otra persona, pide otro nombre para registrarla", async () => {
      const { aplicacion } = montar(almacenamientosConAnaFueraDeLaTolerancia());
      await navegarA("Participantes");
      hacerClic("Registrar participante");
      completar("Nombre", "ana", dialogoAbierto());
      hacerClic("Registrar", dialogoAbierto());

      hacerClic("No, es otra persona", dialogoAbierto());
      expect(textoDe(dialogoAbierto())).toContain("Ya hay alguien con el nombre ana. Escribí otro nombre.");
      completar("Nombre", "ana g", dialogoAbierto());
      hacerClic("Registrar", dialogoAbierto());

      expect(hayDialogoAbierto()).toBe(false);
      expect(aplicacion.grupo().participante("ana g")?.estado()).toBe("participando");
      expect(aplicacion.grupo().participante("ana")?.estado()).toBe("inactivo");
    });

    it("registrar el nombre de alguien que participa pide otro nombre", async () => {
      const { aplicacion } = montar(almacenamientosConAnaInactiva());
      await navegarA("Participantes");
      hacerClic("Registrar participante");
      completar("Nombre", "beto", dialogoAbierto());

      hacerClic("Registrar", dialogoAbierto());

      expect(textoDe(dialogoAbierto().querySelector("[role=alert]")!)).toBe(
        "Ya hay alguien con el nombre beto. Escribí otro nombre.",
      );
      expect(nombresDeParticipantes(aplicacion)).toEqual(["ana", "beto", "carla", "dani"]);
    });

    it("quien tiene la garantía incompleta figura entre los activos con ese estado", async () => {
      montar(almacenamientosConGarantiasIncompletas());

      await navegarA("Participantes");

      expect(filasDeActivos()).toContainEqual(["beto", "garantía incompleta"]);
    });

    it("registrar el nombre de alguien con la garantía incompleta pide otro nombre", async () => {
      montar(almacenamientosConGarantiasIncompletas());
      await navegarA("Participantes");
      hacerClic("Registrar participante");
      completar("Nombre", "beto", dialogoAbierto());

      hacerClic("Registrar", dialogoAbierto());

      expect(textoDe(dialogoAbierto().querySelector("[role=alert]")!)).toBe(
        "Ya hay alguien con el nombre beto. Escribí otro nombre.",
      );
    });

    it("quien superó la tolerancia de faltas figura entre quienes ya no participan, para reingresarlo, y no entre los activos", async () => {
      montar(almacenamientosConAnaFueraDeLaTolerancia());

      await navegarA("Participantes");

      expect(filasDeQuienesYaNoParticipan()).toEqual([["ana", "Reingresar"]]);
      expect(filasDeActivos().map(([nombre]) => nombre)).toEqual(["beto", "carla", "dani"]);
    });

    it("las faltas de un inactivo se cuentan contra la tolerancia de las reglas actuales", async () => {
      const almacenamientos = almacenamientosConAnaInactiva();
      nuevaAplicacion(almacenamientos).cambiarReglas(reglas({ rigeDesde: dia(3), toleranciaDeFaltas: 3 }));
      montar(almacenamientos);

      await navegarA("Participantes");

      expect(textosDeLasCeldas(fila("ana"))).toEqual(["ana", "inactivo (1/3 faltas)"]);
    });

    it("sin participaciones activas dice que todavía no hay nadie", async () => {
      montar(almacenamientosConGrupoSinParticipantes());

      await navegarA("Participantes");

      expect(hayElementoConTexto("p", "Todavía no hay nadie")).toBe(true);
      expect(document.querySelector("table")).toBeNull();
    });
  });

  describe("pantalla de caja", () => {
    it("los saldos muestran por nombre lo que tiene por recibir cada uno, y el total por repartir sin un total por cobrar en cero", async () => {
      const almacenamientos = almacenamientosConAnaInactiva(); // beto recibe 334, carla y dani 333
      nuevaAplicacion(almacenamientos).registrarEncuentro(dia(3), ["dani", "carla"], ["ana", "beto"]); // carla y dani reciben 500
      montar(almacenamientos);

      await navegarA("Caja");

      expect(buscar("p > span", (texto) => texto.startsWith("Por cobrar"), document)).toBeUndefined();
      expect(hayElementoConTexto("p > span", "Por repartir $ 2.000")).toBe(true);
      expect(filasDe(elementoConTexto("caption", "Saldos").parentElement!)).toEqual([
        ["beto", "inactivo", "$ 334", "Registrar reparto"],
        ["carla", "participando", "$ 833", "Registrar reparto"],
        ["dani", "participando", "$ 833", "Registrar reparto"],
      ]);
    });

    it("quien tiene la garantía incompleta y créditos muestra las dos cosas, dice si los créditos la cubren, y cuenta en los dos totales", async () => {
      const almacenamientos = almacenamientosConAnaInactiva(); // beto recibe 334, carla y dani 333
      nuevaAplicacion(almacenamientos).cambiarReglas(reglas({ rigeDesde: dia(3), garantia: 1334 }));
      montar(almacenamientos);

      await navegarA("Caja");

      expect(hayElementoConTexto("p > span", "Por cobrar $ 1.002")).toBe(true);
      expect(hayElementoConTexto("p > span", "Por repartir $ 1.000")).toBe(true);
      expect(filasDe(elementoConTexto("caption", "Saldos").parentElement!)).toEqual([
        ["beto", "garantía incompleta (la cubren sus créditos)", "-$ 334 $ 334", "Cobrar garantía Registrar reparto"],
        ["carla", "garantía incompleta", "-$ 334 $ 333", "Cobrar garantía Registrar reparto"],
        ["dani", "garantía incompleta", "-$ 334 $ 333", "Cobrar garantía Registrar reparto"],
      ]);
      expect(textoDe(fila("beto").querySelector(".debe")!)).toBe("-$ 334");
      expect(textoDe(fila("beto").querySelector(".a-favor")!)).toBe("$ 334");
    });

    it("cobrar la garantía desde la caja cobra lo que falta para completarla", async () => {
      const { aplicacion } = montar(almacenamientosConGarantiasIncompletas());
      await navegarA("Caja");

      hacerClic("Cobrar garantía", fila("beto"));
      expect(textoDe(dialogoAbierto())).toContain("Se le va a cobrar $ 500 para completar la garantía de $ 1.500.");
      hacerClic("Cobrar", dialogoAbierto());

      expect(aplicacion.grupo().participante("beto")?.garantia()).toBe(1500);
      expect(hayElementoConTexto("p > span", "Por cobrar $ 1.000")).toBe(true);
    });

    it("repartir entrega los créditos pendientes y queda entre los movimientos, junto a los cobros de garantía", async () => {
      const { aplicacion } = montar(almacenamientosConAnaInactiva()); // beto recibe 334
      await navegarA("Caja");

      hacerClic("Registrar reparto", fila("beto"));
      expect(textoDe(dialogoAbierto().querySelector("h3")!)).toBe("Reparto a beto");
      expect(textoDe(dialogoAbierto())).toContain("Se le van a entregar $ 334.");
      hacerClic("Registrar reparto", dialogoAbierto());

      expect(aplicacion.grupo().caja().montoPendienteDe("beto")).toBe(0);
      expect(filasDe(elementoConTexto("summary", "Movimientos").parentElement!)).toEqual([
        [fechaYHora(ahora()), "beto", "reparto", "$ 334"],
        ...["dani", "carla", "beto", "ana"].map((nombre) => [fechaYHora(dia(1)), nombre, "cobro", "$ 1.000"]),
      ]);
    });

    it("sin saldos dice que no hay nada para cobrar ni repartir", async () => {
      montar(almacenamientosConGrupoSinParticipantes());

      await navegarA("Caja");

      expect(hayElementoConTexto("p", "No hay nada para cobrar ni repartir")).toBe(true);
      expect(document.querySelector("table")).toBeNull();
    });
  });

  describe("pantalla del encuentro", () => {
    it("antes de empezar el encuentro sólo se puede empezarlo", () => {
      montar(almacenamientosConAnaInactiva());

      const botones = [...document.querySelectorAll("main button")].map(textoDe);

      expect(botones).toEqual(["Empezar encuentro"]);
      expect(document.querySelector("main table")).toBeNull();
    });

    it("empezar el encuentro abre la planilla de asistencia sin nadie marcado", () => {
      const { aplicacion } = montar(almacenamientosConAnaInactiva());

      hacerClic("Empezar encuentro");

      expect(aplicacion.tienePlanillaDeAsistencia()).toBe(true);
      expect(casillaDeAsistencia("beto").checked).toBe(false);
      expect(hayElementoConTexto("button", "Empezar encuentro")).toBe(false);
    });

    it("registrar el encuentro toma como presentes a los marcados, incluso a quien pagó la garantía en la puerta, descarta la planilla y pasa al historial", () => {
      const { aplicacion, almacenamientos } = montar(almacenamientosConAnaInactiva());
      expect(pantallaActual()).toBe("Encuentro");

      hacerClic("Empezar encuentro");
      casillaDeAsistencia("beto").click();
      casillaDeAsistencia("carla").click();
      expect(casillaDeAsistencia("ana").disabled).toBe(true);
      hacerClic("Cobrar garantía y habilitar", fila("ana"));
      expect(textoDe(dialogoAbierto())).toContain("Se le va a cobrar una garantía de $ 1.000.");
      hacerClic("Cobrar", dialogoAbierto());
      expect(casillaDeAsistencia("ana").disabled).toBe(false);
      expect(casillaDeAsistencia("ana").checked).toBe(true);
      hacerClic("Registrar encuentro");
      expect(textoDe(dialogoAbierto())).toContain("Quedan ausentes: dani.");
      hacerClic("Confirmar", dialogoAbierto());

      const [, encuentro] = aplicacion.grupo().encuentros();
      expect(encuentro.fecha()).toEqual(ahora());
      expect(encuentro.asistentes()).toEqual(new Set(["beto", "carla", "ana"]));
      expect(aplicacion.grupo().participante("dani")?.estado()).toBe("inactivo");
      expect(almacenamientos.planilla.leer()).toBeUndefined();
      expect(pantallaActual()).toBe("Historial");
      expect(filasDe(document.querySelector("main")!)[0]).toEqual([
        fechaYHora(ahora()),
        "Encuentro con 3/4 presentes",
        "Ver Deshacer",
      ]);
    });

    it("descartar el encuentro sin nadie marcado no pide confirmación", () => {
      const { aplicacion, almacenamientos } = montar(almacenamientosConAnaInactiva());
      hacerClic("Empezar encuentro");

      hacerClic("Descartar");

      expect(hayDialogoAbierto()).toBe(false);
      expect(aplicacion.tienePlanillaDeAsistencia()).toBe(false);
      expect(almacenamientos.planilla.leer()).toBeUndefined();
      expect(hayElementoConTexto("button", "Empezar encuentro")).toBe(true);
    });

    it("descartar el encuentro con alguien marcado pide confirmación antes de perder las marcas", () => {
      const { aplicacion } = montar(almacenamientosConAnaInactiva());
      hacerClic("Empezar encuentro");
      casillaDeAsistencia("beto").click();

      hacerClic("Descartar");
      expect(textoDe(dialogoAbierto().querySelector("h3")!)).toBe("¿Descartar registro del encuentro?");
      expect(textoDe(dialogoAbierto())).toContain("Se van a perder las marcas de asistencia.");
      hacerClic("Sí, descartar", dialogoAbierto());

      expect(aplicacion.tienePlanillaDeAsistencia()).toBe(false);
      expect(hayElementoConTexto("button", "Empezar encuentro")).toBe(true);
    });

    it("volver de la confirmación de descarte conserva la planilla de asistencia con sus marcas", () => {
      const { aplicacion } = montar(almacenamientosConAnaInactiva());
      hacerClic("Empezar encuentro");
      casillaDeAsistencia("beto").click();
      hacerClic("Descartar");

      hacerClic("No, volver", dialogoAbierto());

      expect(hayDialogoAbierto()).toBe(false);
      expect(aplicacion.tienePlanillaDeAsistencia()).toBe(true);
      expect(casillaDeAsistencia("beto").checked).toBe(true);
    });

    it("la confirmación del registro dice que el encuentro lleva la fecha del momento de registrarlo", () => {
      montar(almacenamientosConAnaInactiva());
      hacerClic("Empezar encuentro");

      hacerClic("Registrar encuentro");

      expect(textoDe(dialogoAbierto())).toContain(`Se va a registrar el encuentro con fecha ${fechaYHora(ahora())}.`);
    });

    it("la confirmación del registro nombra a los posibles asistentes sin marcar, incluso a un inactivo que no superó la tolerancia", () => {
      const almacenamientos = almacenamientosConAnaInactiva();
      const preparacion = nuevaAplicacion(almacenamientos);
      preparacion.ingresar("eva", dia(2));
      preparacion.registrarEncuentro(dia(3), ["beto", "carla", "dani"], ["ana", "eva"]);
      preparacion.registrarEncuentro(dia(4), ["beto", "carla", "dani"], ["ana", "eva"]); // ana supera la tolerancia y eva no
      montar(almacenamientos);

      hacerClic("Empezar encuentro");
      casillaDeAsistencia("beto").click();
      hacerClic("Registrar encuentro");

      expect(textoDe(dialogoAbierto())).toContain("Quedan ausentes: carla, dani, eva.");
      expect(textoDe(dialogoAbierto())).not.toContain("ana");
    });

    it("si sólo quedan sin marcar quienes superaron la tolerancia, la confirmación del registro dice que nadie queda ausente", () => {
      montar(almacenamientosConAnaFueraDeLaTolerancia());

      hacerClic("Empezar encuentro");
      ["beto", "carla", "dani"].forEach((nombre) => casillaDeAsistencia(nombre).click());
      hacerClic("Registrar encuentro");

      expect(textoDe(dialogoAbierto())).toContain("Nadie queda ausente.");
    });

    it("la planilla de asistencia sobrevive a una recarga y vuelve a abrir la pantalla del encuentro", () => {
      const almacenamientos = almacenamientosConAnaInactiva();
      montar(almacenamientos);
      hacerClic("Empezar encuentro");
      casillaDeAsistencia("beto").click();
      almacenamientos.pantalla.guardar("participantes");

      recargar(almacenamientos);

      expect(pantallaActual()).toBe("Encuentro");
      expect(casillaDeAsistencia("beto").checked).toBe(true);
      expect(casillaDeAsistencia("carla").checked).toBe(false);
    });

    it("si vuelve alguien que ya no participa y es la misma persona, se le cobra la garantía y queda marcado como presente", () => {
      const { aplicacion } = montar(almacenamientosConAnaFueraDeLaTolerancia());
      hacerClic("Empezar encuentro");

      hacerClic("Vino alguien nuevo");
      completar("Nombre", "ana", dialogoAbierto());
      hacerClic("Registrar", dialogoAbierto());
      hacerClic("Sí", dialogoAbierto());

      expect(aplicacion.grupo().participante("ana")?.estado()).toBe("participando");
      expect(casillaDeAsistencia("ana").checked).toBe(true);
    });

    it("a quien tiene la garantía incompleta se le cobra la diferencia para habilitarlo, y queda marcado como presente", () => {
      const { aplicacion } = montar(almacenamientosConGarantiasIncompletas());
      hacerClic("Empezar encuentro");

      hacerClic("Cobrar garantía y habilitar", fila("beto"));
      expect(textoDe(dialogoAbierto())).toContain("Se le va a cobrar $ 500 para completar la garantía de $ 1.500.");
      hacerClic("Cobrar", dialogoAbierto());

      expect(aplicacion.grupo().participante("beto")?.garantia()).toBe(1500);
      expect(casillaDeAsistencia("beto").checked).toBe(true);
      expect(textosDeLasCeldas(fila("carla"))).toEqual([
        "",
        "carla",
        "garantía incompleta",
        "Cobrar garantía y habilitar",
      ]);
    });

    it("a quien tiene créditos pendientes se le cobra la garantía en parte con ellos, y el resto en efectivo", () => {
      const { aplicacion } = montar(almacenamientosConAnaInactivaConCreditos());
      hacerClic("Empezar encuentro");

      hacerClic("Cobrar garantía y habilitar", fila("ana"));
      expect(textoDe(dialogoAbierto())).toContain(
        "Se le va a cobrar una garantía de $ 1.000 ($ 500 de créditos, $ 500 en efectivo).",
      );
      hacerClic("Cobrar", dialogoAbierto());

      expect(aplicacion.grupo().caja().movimientos().at(-1)?.monto()).toBe(500);
      expect(casillaDeAsistencia("ana").checked).toBe(true);
    });

    it("a quien tiene créditos pendientes que cubren toda la garantía no se le cobra nada en efectivo", () => {
      const almacenamientos = almacenamientosConAnaInactivaConCreditos();
      nuevaAplicacion(almacenamientos).cambiarReglas(reglas({ rigeDesde: dia(3), garantia: 400 }));
      const { aplicacion } = montar(almacenamientos);
      hacerClic("Empezar encuentro");

      hacerClic("Cobrar garantía y habilitar", fila("ana"));
      expect(textoDe(dialogoAbierto())).toContain(
        "Se le va a cobrar una garantía de $ 400 (todo de créditos, nada en efectivo).",
      );
      hacerClic("Cobrar", dialogoAbierto());

      expect(aplicacion.grupo().caja().movimientos()).toHaveLength(3);
      expect(casillaDeAsistencia("ana").checked).toBe(true);
    });

    it("sin posibles asistentes dice que todavía no hay nadie", async () => {
      montar(almacenamientosConGrupoSinParticipantes());
      await navegarA("Encuentro");

      hacerClic("Empezar encuentro");

      expect(hayElementoConTexto("p", "Todavía no hay nadie")).toBe(true);
      expect(document.querySelector("table")).toBeNull();
    });
  });

  describe("pantalla de reglas", () => {
    it("las reglas cambiadas rigen desde el momento del cambio", async () => {
      const { aplicacion } = montar(almacenamientosConAnaInactiva());
      await navegarA("Reglas");
      expect(hayEtiqueta("Rige desde")).toBe(false);

      completar("¿Cuánto se paga de garantía?", "1500");
      hacerClic("Cambiar reglas");
      hacerClic("Confirmar", dialogoAbierto());

      expect(aplicacion.grupo().reglas().garantia()).toBe(1500);
      expect(aplicacion.grupo().reglas().rigeDesde()).toEqual(ahora());
    });

    it("cambiar las reglas pide confirmar antes quiénes deben completar la garantía y quiénes reciben un crédito", async () => {
      const almacenamientos = almacenamientosConGarantiasIncompletas();
      nuevaAplicacion(almacenamientos).ingresar("eli", dia(3));
      const { aplicacion } = montar(almacenamientos);
      await navegarA("Reglas");
      completar("¿Cuánto se paga de garantía?", "1200");

      hacerClic("Cambiar reglas");

      expect(textoDe(dialogoAbierto())).toContain(
        "beto, carla y dani deben completar $ 200; eli recibe un crédito de $ 300.",
      );
      expect(aplicacion.grupo().reglas().garantia()).toBe(1500);
    });

    it("cambiar las reglas avisa qué parte de lo que falta de la garantía cubre cada uno con sus créditos", async () => {
      montar(almacenamientosConAnaInactiva()); // beto recibe 334, carla y dani 333
      await navegarA("Reglas");
      completar("¿Cuánto se paga de garantía?", "1334");

      hacerClic("Cambiar reglas");

      expect(textoDe(dialogoAbierto())).toContain(
        "carla y dani cubren $ 333 con sus créditos y deben completar $ 1; beto cubre $ 334 con sus créditos.",
      );
    });

    it("cambiar las reglas sin que nadie tenga que completar la garantía ni reciba un crédito avisa que no cambia la plata de nadie", async () => {
      montar(almacenamientosConGarantiasIncompletas());
      await navegarA("Reglas");
      completar("¿Cuántas faltas seguidas se toleran antes de quedar afuera?", "3");

      hacerClic("Cambiar reglas");

      expect(textoDe(dialogoAbierto())).toContain("No cambia la plata de nadie.");
    });

    it("la garantía se explica junto a su valor vigente, y no otra vez en el campo para cambiarla", async () => {
      montar(almacenamientosConAnaInactiva());

      await navegarA("Reglas");

      expect(textoDe(elementoConTexto("dt", "Garantía").nextElementSibling!)).toContain(explicacionDeLaGarantia);
      expect(textoDe(etiqueta("¿Cuánto se paga de garantía?")!)).not.toContain(explicacionDeLaGarantia);
    });
  });

  describe("pantalla del historial", () => {
    it("deshacer el registro de un encuentro restaura su planilla de asistencia", async () => {
      const { aplicacion } = montar(almacenamientosConAnaInactiva());
      await navegarA("Historial");
      expect(pantallaActual()).toBe("Historial");

      hacerClic("Deshacer");

      expect(aplicacion.grupo().encuentros()).toEqual([]);
      expect(pantallaActual()).toBe("Encuentro");
      expect(marcadosComoPresentes(["ana", "beto", "carla", "dani"])).toEqual(["beto", "carla", "dani"]);
    });

    it("deshacer el registro de un encuentro con una planilla empezada que tiene marcas pide confirmación", async () => {
      const { aplicacion } = montar(almacenamientosConAnaInactivaYUnaPlanillaCon(["beto"]));
      await navegarA("Historial");

      hacerClic("Deshacer");

      expect(textoDe(dialogoAbierto().querySelector("h3")!)).toBe("¿Deshacer el encuentro?");
      expect(textoDe(dialogoAbierto())).toContain(
        "Hay una planilla de asistencia empezada. Se va a reemplazar por la del encuentro deshecho.",
      );
      expect(aplicacion.grupo().encuentros()).toHaveLength(1);
      expect(aplicacion.planillaDeAsistencia().asistentes()).toEqual(["beto"]);
    });

    it("confirmar que se deshace el encuentro reemplaza la planilla empezada por la del encuentro deshecho", async () => {
      const { aplicacion } = montar(almacenamientosConAnaInactivaYUnaPlanillaCon(["beto"]));
      await navegarA("Historial");
      hacerClic("Deshacer");

      hacerClic("Sí, deshacer", dialogoAbierto());

      expect(hayDialogoAbierto()).toBe(false);
      expect(aplicacion.grupo().encuentros()).toEqual([]);
      expect(pantallaActual()).toBe("Encuentro");
      expect(marcadosComoPresentes(["ana", "beto", "carla", "dani"])).toEqual(["beto", "carla", "dani"]);
    });

    it("volver de la confirmación de deshacer el encuentro conserva la planilla empezada", async () => {
      const { aplicacion } = montar(almacenamientosConAnaInactivaYUnaPlanillaCon(["beto"]));
      await navegarA("Historial");
      hacerClic("Deshacer");

      hacerClic("No, volver", dialogoAbierto());

      expect(hayDialogoAbierto()).toBe(false);
      expect(aplicacion.grupo().encuentros()).toHaveLength(1);
      expect(aplicacion.planillaDeAsistencia().asistentes()).toEqual(["beto"]);
      expect(pantallaActual()).toBe("Historial");
    });

    it("deshacer el registro de un encuentro con una planilla empezada sin marcas no pide confirmación", async () => {
      const { aplicacion } = montar(almacenamientosConAnaInactivaYUnaPlanillaCon([]));
      await navegarA("Historial");

      hacerClic("Deshacer");

      expect(hayDialogoAbierto()).toBe(false);
      expect(aplicacion.grupo().encuentros()).toEqual([]);
      expect(pantallaActual()).toBe("Encuentro");
      expect(marcadosComoPresentes(["ana", "beto", "carla", "dani"])).toEqual(["beto", "carla", "dani"]);
    });

    it("deshacer un comando que no es un registro de encuentro, con una planilla empezada, deja la pantalla del historial", async () => {
      const almacenamientos = almacenamientosConAnaInactivaYUnaPlanillaCon(["beto"]);
      nuevaAplicacion(almacenamientos).cobrarGarantia("ana", dia(3));
      montar(almacenamientos);
      await navegarA("Historial");

      hacerClic("Deshacer");

      expect(hayDialogoAbierto()).toBe(false);
      expect(textoDe(document.querySelector("main")!)).not.toContain("Se cobró");
      expect(pantallaActual()).toBe("Historial");
    });

    it("deshacer un comando que no es un registro de encuentro, sin planilla empezada, deja la pantalla del historial", async () => {
      const almacenamientos = almacenamientosConAnaInactiva();
      nuevaAplicacion(almacenamientos).cobrarGarantia("ana", dia(3));
      montar(almacenamientos);
      await navegarA("Historial");

      hacerClic("Deshacer");

      expect(pantallaActual()).toBe("Historial");
    });

    it("un encuentro registrado dice cuántos vinieron de los posibles asistentes, y su detalle quién estuvo presente y quién ausente", async () => {
      montar(almacenamientosConAnaInactiva());
      await navegarA("Historial");

      hacerClic("Ver", fila("Encuentro con 3/4 presentes"));
      expect(textoDe(dialogoAbierto().querySelector("h3")!)).toBe(`Encuentro del ${fechaYHora(dia(2))}`);
      expect([...dialogoAbierto().querySelectorAll("th")].map(textoDe)).toEqual(["Nombre", "Asistencia"]);
      expect(filasDe(dialogoAbierto())).toEqual([
        ["ana", "Ausente"],
        ["beto", "Presente"],
        ["carla", "Presente"],
        ["dani", "Presente"],
      ]);
      hacerClic("Cerrar", dialogoAbierto());

      expect(document.querySelector("dialog")).toBeNull();
    });

    it("importar en un dispositivo nuevo lo exportado en otro reproduce los mismos participantes", async () => {
      const { aplicacion: original } = montar(almacenamientosConAnaInactiva());
      await navegarA("Historial");
      const exportado = await exportar();
      const almacenamientos = nuevosAlmacenamientos();
      nuevaAplicacion(almacenamientos).crearGrupo("Otro grupo", reglas());
      const { aplicacion } = recargar(almacenamientos);
      await navegarA("Historial");

      elegirArchivo("Importar", exportado);
      await vi.waitFor(() => dialogoAbierto());
      expect(textoDe(dialogoAbierto())).toContain("reemplazar");
      hacerClic("Reemplazar", dialogoAbierto());

      expect(aplicacion.grupo().nombre()).toBe("Fútbol de los jueves");
      expect(nombresDeParticipantes(aplicacion)).toEqual(nombresDeParticipantes(original));
      expect(aplicacion.grupo().participante("ana")?.estado()).toBe("inactivo");
      expect(textoDe(document.querySelector("h1")!)).toBe("Fútbol de los jueves");
    });
  });
});
