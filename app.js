require("dotenv").config();
const {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
} = require("@bot-whatsapp/bot");

const BaileysProvider = require("@bot-whatsapp/provider/baileys");
const MockAdapter = require("@bot-whatsapp/database/mock");

const welcomeFlow = require("./flows/welcome.flow");
const generalFlow = require("./flows/general.flow");
const chat = require("./services/chatgpt");

const { init } = require("bot-ws-plugin-openai");
const ServerAPI = require("./http");

/**
 * Configuracion de Plugin
 */
const employeesAddonConfig = {
  model: "gpt-4",
  temperature: 0.75,
  apiKey: process.env.OPENAI_API_KEY,
};
const employeesAddon = init(employeesAddonConfig);

employeesAddon.employees([
  {
    name: "EMPLEADO_GENERAL",
    description:
      "Soy Vicky, la asistente de ventas de MuuStack. Estoy aquí para ayudarte con tus consultas y orientarte sobre nuestros servicios. Si necesitas agendar una reunión con uno de nuestros expertos, puedo ayudarte con eso.",
    flow: generalFlow,
  },
]);

const main = async () => {
  try {
    const adapterDB = new MockAdapter();
    const adapterFlow = createFlow([welcomeFlow, generalFlow]);
    const adapterProvider = createProvider(BaileysProvider);
    const httpServer = new ServerAPI(adapterProvider, adapterDB);

    const configBot = {
      flow: adapterFlow,
      provider: adapterProvider,
      database: adapterDB,
    };

    const configExtra = {
      extensions: {
        employeesAddon,
      },
    };

    const bot = await createBot(configBot, configExtra);

    // Manejar el evento "fallback" para redirigir a EMPLEADO_GENERAL
    bot.on("fallback", async (ctx) => {
      console.log(
        "No se encontró una respuesta específica. Redirigiendo a EMPLEADO_GENERAL..."
      );

      try {
        const prompt =
          'El usuario ha realizado una consulta para la cual no tenemos una respuesta específica. Por favor proporciona una respuesta adecuada para esta consulta: "' +
          ctx.body +
          '"';
        const respuestaIA = await chat(prompt, ctx.body);

        if (respuestaIA?.content) {
          return ctx.reply(respuestaIA.content);
        }

        const generalFlowInstance = generalFlow;
        if (typeof generalFlowInstance === "function") {
          await generalFlowInstance(ctx, {
            state: {
              get: (key) => ctx.state[key],
              update: (newState) => ctx.state.update(newState),
            },
            flowDynamic: bot.flowDynamic,
          });
        } else {
          console.error("generalFlow no es una función válida");
        }
      } catch (error) {
        console.error(
          "Error al redirigir al flujo general o al consultar al prompt:",
          error
        );
        ctx.reply("Ocurrió un error, por favor intenta nuevamente.");
      }
    });

    // Redirigir al flujo general cuando no se encuentra un empleado en el flujo de bienvenida
    welcomeFlow.addAction(async (ctx, ctxFn) => {
      const { state } = ctxFn;
      const mensajeEntrante = ctx.body || "";
      const pluginAi = ctxFn.extensions?.employeesAddon;

      // Usar el servicio de chat IA para verificar si el mensaje es una expresión común
      try {
        const prompt =
          "Determina si el siguiente mensaje es una respuesta común como 'ok', 'muchas gracias', 'perfecto', 'entendido'. Responde solo con 'comun' o 'no comun'.";
        const respuestaIA = await chat(prompt, mensajeEntrante);

        if (respuestaIA?.content?.toLowerCase().includes("comun")) {
          return ctxFn.flowDynamic(
            "¡Entendido! Si necesitas algo más, aquí estaré."
          );
        }
      } catch (error) {
        console.error(
          "Error al usar el servicio de IA para analizar la respuesta común:",
          error
        );
      }

      if (!pluginAi) {
        console.error("El complemento employeesAddon no está disponible.");
        return ctxFn.flowDynamic(
          "Error al procesar tu solicitud. Por favor intenta de nuevo."
        );
      }

      const empleadoIdeal = await pluginAi.determine(mensajeEntrante);

      if (!empleadoIdeal?.employee) {
        console.log(
          "No se encontró un empleado ideal para la solicitud, consultando al prompt..."
        );
        const prompt =
          'El usuario ha realizado una consulta para la cual no se encontró un empleado ideal. Por favor proporciona una respuesta adecuada para esta consulta: "' +
          mensajeEntrante +
          '"';
        const respuestaIA = await chat(prompt, mensajeEntrante);

        if (respuestaIA?.content) {
          return ctxFn.flowDynamic(respuestaIA.content);
        }
        return await generalFlow(ctx, ctxFn);
      }

      state.update({ answer: empleadoIdeal.answer });
      return ctxFn.flowDynamic(empleadoIdeal.answer);
    });

    httpServer.start();
  } catch (error) {
    console.error("Error al iniciar el bot:", error);
  }
};

main();
