const fs = require("fs");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

/**
 *
 * @param {*} text
 */

const chat = async (prompt, text, last2 = "") => {
  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content:
            "Historial de conversacion: " +
            last2 +
            "\n Pregunta a responder: " +
            text,
        },
      ],
    });
    return completion.data.choices[0].message;
  } catch (err) {
    console.log(err.response.data);
    return "ERROR, no se pudo completar la solicitud";
  }
};
