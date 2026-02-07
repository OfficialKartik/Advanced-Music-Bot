// --- Gemini AI Handler (Official SDK, CommonJS) --- //
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();
const client = require("./main"); // Your main bot client file

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

// List of channels where AI chat is active
const AI_ACTIVE_CHANNELS = [
    "1404724644660904028",
    "1338158878990401536"
];

const MESSAGE_HISTORY_SIZE = 10;
const conversationHistory = new Map();

function getConversationContext(channelId) {
    if (!conversationHistory.has(channelId)) {
        conversationHistory.set(channelId, []);
    }
    return conversationHistory.get(channelId);
}

function addToConversationHistory(channelId, role, text) {
    const history = getConversationContext(channelId);
    history.push({ role, text });
    if (history.length > MESSAGE_HISTORY_SIZE) history.shift();
}

async function getGeminiResponse(prompt, channelId) {
    try {
        const history = getConversationContext(channelId);

        // Build conversation prompt
        let conversationText = "You are a helpful Discord bot assistant. Keep responses concise and friendly. No markdown formatting.\n\n";
        for (const msg of history) {
            conversationText += `${msg.role === "bot" ? "Bot" : "User"}: ${msg.text}\n`;
        }
        conversationText += `User: ${prompt}\nBot:`;

        // Call Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(conversationText);
        return result.response.text();
    } catch (error) {
        console.error("Error getting Gemini response:", error);
        return "Sorry, I encountered an error processing your request.";
    }
}

// AI Chat Message Handler
client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;
    if (!AI_ACTIVE_CHANNELS.includes(message.channel.id)) return;

    await message.channel.sendTyping();

    try {
        addToConversationHistory(message.channel.id, "user", message.content);

        const aiResponse = await getGeminiResponse(message.content, message.channel.id);

        addToConversationHistory(message.channel.id, "bot", aiResponse);

        if (aiResponse.length > 2000) {
            for (let i = 0; i < aiResponse.length; i += 2000) {
                await message.reply(aiResponse.substring(i, i + 2000));
            }
        } else {
            await message.reply(aiResponse);
        }
    } catch (error) {
        console.error("Error in AI chat response:", error);
        await message.reply("Sorry, I encountered an error processing your message.");
    }
});
