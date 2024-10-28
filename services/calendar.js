// Función para formatear la fecha en formato específico
const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
};

/**
 * Consulto la fecha del calendario
 * @returns
 */
const getCurrentCalendar = async () => {
  // Realiza una solicitud HTTP a una API para obtener los datos del calendario
  const dataCalendarApi = await fetch(
    "https://hook.us2.make.com/7o2momc999gwwug3yvyr96r89u7nvpmj"
  );

  // Parsea la respuesta de la API a formato JSON
  const json = await dataCalendarApi.json();

  // Reduce el JSON obtenido a una cadena de texto que describe los eventos del calendario
  const list = json.reduce((prev, current) => {
    const startDate = new Date(current.date);
    const endDate = new Date(startDate.getTime() + 45 * 60000); // Suma 45 minutos

    return (prev += [
      `Espacio reservado (no disponible): `,
      `Desde ${formatDate(startDate)} `,
      `Hasta ${formatDate(endDate)}\n`,
    ].join(" "));
  }, "");

  return list;
};

/**
 * Agrego un evento al calendario
 * @param text
 * @returns
 */
const appToCalendar = async (text) => {
  try {
    // Parsea el texto proporcionado a un objeto JSON
    const payload = JSON.parse(text);
    console.log(payload); // Muestra el objeto parseado en la consola

    // Realiza una solicitud HTTP POST para agregar un evento al calendario
    const dataApi = await fetch(
      "https://hook.us2.make.com/3tjq6y8ewbpfhvedj9bma51gq5obdoso",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload), // Convierte el payload a una cadena JSON para enviarlo en el cuerpo de la solicitud
      }
    );

    return dataApi;
  } catch (err) {
    // Si ocurre un error, se muestra en la consola
    console.log(`error: `, err);
  }
};

export { getCurrentCalendar, appToCalendar };
