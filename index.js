const qrcode = require("qrcode-terminal");

const fs = require("fs"); // Import the fs module

const { Client, MessageMedia } = require("whatsapp-web.js");
const client = new Client({
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function sendMessage(message) {
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: "user", content: message }],
    model: "gpt-3.5-turbo",
  });

  return chatCompletion.choices[0].message.content;
}

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => {
  console.log("Autenticado!");
});

client.on("auth_failure", (msg) => {
  console.error("Error de autenticación", msg);
});

client.on("loading_screen", (porcentaje, mensaje) => {
  console.log(`Cargando: ${porcentaje} - ${mensaje}`);
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.on("message", async (message) => {
  if (message.body === "lol") {
    const media = MessageMedia.fromFilePath("./lol.png");
    message.reply(media);
  } else if (message.body === "Hola") {
    const contact = await message.getContact();
    const chat = await message.getChat();

    message.reply(`Hola ${contact.pushname}, estás en el chat ${chat.name}!`);
  } else if (message.body === "Foto de Cookie") {
    // grab random file from directory cookie
    const fileList = fs.readdirSync("./cookie");
    const randomFile = fileList[Math.floor(Math.random() * fileList.length)];

    const media = MessageMedia.fromFilePath(`./cookie/${randomFile}`);
    message.reply(media);
  } else if (message.body === "123") {
    // get message info
    const contact = await message.getContact();
    const chat = await message.getChat();

    console.log(chat);

    console.log(chat.isGroup);

    if (chat.isGroup) {
      console.log("Es un grupo");
      await client.sendMessage(
        contact.id._serialized,
        "Hello from whatsapp-bot!"
      );
    } else {
      console.log("Es un chat");
    }
  } else if (
    message.body.startsWith("Presupuesto entre $") &&
    message.body.includes(" y ") &&
    message.body.includes(" en ")
  ) {
    // Handle budget range request
    const budgetRegex = /entre \$([0-9]+) y \$([0-9]+) en (\w+)/;
    const matches = message.body.match(budgetRegex);

    if (matches) {
      const [, min, max, location] = matches;
      const fileList = fs.readdirSync("./");
      const filteredFiles = fileList.filter((file) => {
        const matchResult = file.match(/(\d+)/);
        if (matchResult) {
          const price = parseInt(matchResult[0], 10);
          return (
            price >= parseInt(min, 10) &&
            price <= parseInt(max, 10) &&
            file.includes(location)
          );
        }
        return false;
      });

      if (filteredFiles.length > 0) {
        const mediaPromises = filteredFiles.map((file) =>
          MessageMedia.fromFilePath(`./${file}`)
        );
        Promise.all(mediaPromises)
          .then((mediaArray) => {
            mediaArray.forEach((media) => {
              message.reply(media);
            });
          })
          .catch((error) => {
            console.error("Error sending media:", error);
          });
      } else {
        message.reply("No se encontraron resultados.");
      }
    } else {
      message.reply(
        `Formato no válido. Por favor usa "Presupuesto entre [$min] y [$max] (números sin comas) en [ubicación]".`
      );
    }
  } else if (message.body.includes("Juan")) {
    sendMessage(message.body).then((response) => {
      message.reply(response);
    });
  }
});

client.initialize();
