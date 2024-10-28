const { addKeyword, EVENTS } = require("@bot-whatsapp/bot");

/**
 * Punto de Entrada Mejorado
 * Flujo de bienvenida con manejo de errores y verificación de empleados
 */
module.exports = addKeyword(EVENTS.WELCOME).addAction(async (ctx, ctxFn) => {
  try {
    const { state } = ctxFn;
    const mensajeEntrante = ctx.body || ""; // Manejar el caso de mensaje vacío
    const pluginAi = ctxFn.extensions?.employeesAddon;

    // Verificar si employeesAddon está configurado correctamente
    if (!pluginAi) {
      console.error("El complemento employeesAddon no está disponible.");
      return ctxFn.flowDynamic(
        "Error al procesar tu solicitud. Por favor intenta de nuevo."
      );
    }

    // Determinar el empleado ideal para manejar la solicitud del usuario
    const empleadoIdeal = await pluginAi.determine(mensajeEntrante);

    if (!empleadoIdeal?.employee) {
      console.log("No se encontró un empleado ideal para la solicitud.");
      state.update({ lastInteraction: "not_understood" });

      return ctxFn.flowDynamic(
        "Ups, lo siento, no entiendo tu solicitud. ¿Podrías ser más específico?"
      );
    }

    // Actualizar el estado con la respuesta y empleado seleccionado
    state.update({
      answer: empleadoIdeal.answer,
      lastEmployee: empleadoIdeal.employee,
    });

    // Enviar la respuesta utilizando flowDynamic
    return ctxFn.flowDynamic(empleadoIdeal.answer);
  } catch (error) {
    console.error("Error en welcomeFlow:", error);
    return ctxFn.flowDynamic(
      "Ocurrió un error inesperado. Por favor intenta de nuevo."
    );
  }
});
