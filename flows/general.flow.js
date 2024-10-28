const { addKeyword, EVENTS } = require("@bot-whatsapp/bot");
const fs = require("fs");
const path = require("path");
const chat = require("../services/chatgpt.js");

/**
 * Flujo Inteligente (va a ser activado por una intención de una persona o por palabra clave)
 * Flujo de bienvenida
 */
module.exports = addKeyword(EVENTS.ACTION).addAction(
  async (ctx, { state, flowDynamic }) => {
    // Obtener la ruta del archivo del prompt
    const pathIntro = path.join(__dirname, "/prompts", "promptIntro.txt");

    // Leer el archivo del prompt
    const prompt = fs.readFileSync(pathIntro, "utf-8");

    // Llamar a la función chat para obtener la respuesta
    const answ = await chat(prompt, ctx.body, "");

    // Continuar con el flujo
    return flowDynamic(answ.content);
  }
);
