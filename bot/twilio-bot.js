// // twilio-bot.js
// require("dotenv").config();
// const express = require("express");
// const bodyParser = require("body-parser");
// const twilio = require("twilio");
// const { handleOnboarding, onboardingStates } = require("./bot/commands/onboarding");
// const { handleReceipt } = require("./bot/commands/receipt");
// const { handleSalesToday } = require("./bot/commands/salesToday");
// const { handleSalesMonth } = require("./bot/commands/salesMonth");
// const { handleHelp } = require("./bot/commands/help");
// const { getDB, connectDB } = require("./services/db");

// const app = express();
// app.use(bodyParser.urlencoded({ extended: false }));

// const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// const sendMessage = (to, message) => {
//   return client.messages.create({
//     from: "whatsapp:+14155238886", // your Twilio sandbox or approved number
//     to,
//     body: message,
//   });
// };

// app.post("/webhook", async (req, res) => {
//   const from = req.body.From;
//   const text = req.body.Body?.trim();

//   if (!from || !text) {
//     return res.sendStatus(400);
//   }

//   await connectDB();
//   const db = getDB();
//   const vendor = await db.collection("vendors").findOne({ phone: from });

//   const msg = { from }; // Fake msg object for compatibility

//   // Onboarding
//   if (!vendor && !onboardingStates.has(from)) {
//     await handleOnboarding(sendMessage, msg, from, text);
//     return res.sendStatus(200);
//   }

//   if (onboardingStates.has(from)) {
//     await handleOnboarding(sendMessage, msg, from, text);
//     return res.sendStatus(200);
//   }

//   const lower = text.toLowerCase();

//   if (lower.startsWith("/receipt")) {
//     await handleReceipt(sendMessage, msg, from, text, vendor);
//   } else if (lower === "/sales today") {
//     await handleSalesToday(sendMessage, from);
//   } else if (lower === "/sales month") {
//     await handleSalesMonth(sendMessage, from);
//   } else if (lower === "/help") {
//     await handleHelp(sendMessage, from);
//   } else {
//     await sendMessage(from, "🤖 I didn’t understand that.\nType */help* to see what I can do.");
//   }

//   res.sendStatus(200);
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`🚀 Paymint is live on port ${PORT}`));
