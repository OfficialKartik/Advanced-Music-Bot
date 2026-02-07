const { Client, GatewayDispatchEvents, Collection, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");
const { Riffy } = require("riffy");
const { Classic, ClassicPro, Dynamic } = require("musicard");
const fs = require("fs");
const path = require("path");
const config = require("./config.js");
const musicIcons = require("./Emojis/Music.js");
const emoji = require("./Emojis/EmojiId.js");
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();
const port = 8888;


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});


client.commands = new Collection();
client.aliases = new Collection();
client.config = config;
client.nowPlayingMessages = new Collection();
client.interactionCooldowns = new Collection();


client.riffy = new Riffy(client, config.nodes, {
    send: (payload) => {
        const guild = client.guilds.cache.get(payload.d.guild_id);
        if (guild) guild.shard.send(payload);
    },
    defaultSearchPlatform: config.music.defaultSearchPlatform,
    restVersion: "v4"
});


function formatDuration(ms) {
    if (!ms || ms === 0) return "🔴 LIVE";
    
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

async function createMusicCard(track, player) {
    try {
        const currentPosition = player.position || 0;
        const totalDuration = track.info.length || 0;
        
        let progress = 0;
        if (totalDuration > 0) {
            progress = Math.round((currentPosition / totalDuration) * 100);
        }

        const cardOptions = {
            thumbnailImage: track.info.thumbnail || track.info.artworkUrl || "https://via.placeholder.com/512x512/FF7A00/FFFFFF?text=♪",
            backgroundColor: config.colors.background || "#070707",
            progress: Math.max(0, Math.min(100, progress)),
            progressColor: config.colors.primary || "#FF7A00",
            progressBarColor: config.colors.secondary || "#5F2D00",
            name: (track.info.title || "Unknown Title").length > 30 ? 
                  (track.info.title || "Unknown Title").substring(0, 27) + "..." : 
                  (track.info.title || "Unknown Title"),
            nameColor: config.colors.text || "#FF7A00",
            author: `${track.info.author || "Unknown Artist"}`.length > 35 ? 
                   `${track.info.author || "Unknown Artist"}`.substring(0, 32) + "..." : 
                   `${track.info.author || "Unknown Artist"}`,
            authorColor: "#696969",
            startTime: formatDuration(currentPosition),
            endTime: formatDuration(totalDuration),
            timeColor: config.colors.primary || "#FF7A00"
        };

        let musicard;
        switch (config.music.musicardTheme.toLowerCase()) {
            case "classicpro":
                musicard = await ClassicPro(cardOptions);
                break;
            case "dynamic":
                const dynamicOptions = { ...cardOptions };
                delete dynamicOptions.startTime;
                delete dynamicOptions.endTime;
                delete dynamicOptions.timeColor;
                musicard = await Dynamic(dynamicOptions);
                break;
            case "classic":
            default:
                musicard = await Classic(cardOptions);
                break;
        }

        return new AttachmentBuilder(musicard, { name: 'musiccard.png' });
        
    } catch (error) {
        console.error("Error creating music card:", error);
        return null;
    }
}


function createMusicButtons(player) {
    const loopMode = player.loop || "none";

   
    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('music_pause')
                .setEmoji(emoji.pause)
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('music_resume')
                .setEmoji(emoji.resume)
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('music_skip')
                .setEmoji(emoji.skip)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('music_clear')
                .setEmoji(emoji.clear)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('music_leave')
                .setEmoji(emoji.leave)
                .setStyle(ButtonStyle.Danger)
        );


    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('music_shuffle')
                .setEmoji(emoji.shuffle)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('music_repeat')
                .setEmoji(loopMode === "track" ? emoji.repeat_track : emoji.repeat_all)
                .setStyle(loopMode === "none" ? ButtonStyle.Secondary : ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('music_queue')
                .setEmoji(emoji.queue)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('music_volume_down')
                .setEmoji(emoji.vol_down)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('music_volume_up')
                .setEmoji(emoji.vol_up)
                .setStyle(ButtonStyle.Secondary)
        );

    return [row1, row2];
}

async function createNowPlayingEmbed(track, player) {
    const embed = new EmbedBuilder()
        .setColor(config.colors.primary || "#FF7A00")
        .setAuthor({
            name: "Now Playing",
            iconURL: musicIcons.playerIcon
        })
        .setTitle(`${track.info.title || "Unknown Title"}`)
        .setURL(track.info.uri || null)
        .setDescription(
            `**Artist:** ${track.info.author || "Unknown Artist"}\n` +
            `**Duration:** ${formatDuration(track.info.length)}\n` +
            `**Requested by:** ${track.info.requester}\n\n`
        )
        .setImage('attachment://musiccard.png')
        .setFooter({
            text: `${client.user.username} • Premium Music Experience`,
            iconURL: client.user.displayAvatarURL()
        })
        .setTimestamp();

    return embed;
}


async function cleanupPlayer(guildId, reason = "Manual cleanup") {
    try {
        const player = client.riffy.players.get(guildId);
        
       
        const cooldownKeys = Array.from(client.interactionCooldowns.keys());
        cooldownKeys.forEach(key => {
            if (key.startsWith(guildId)) {
                client.interactionCooldowns.delete(key);
            }
        });

     
        const messageInfo = client.nowPlayingMessages.get(guildId);
        if (messageInfo?.message) {
            try {
                await messageInfo.message.delete().catch(() => {});
            } catch (error) {
                console.log("Could not clean up message:", error.message);
            }
        }
        client.nowPlayingMessages.delete(guildId);

      
        if (player) {
            player.stop();
            player.destroy();
        }

        console.log(`🧹 Cleaned up player for guild ${guildId} - ${reason}`);
    } catch (error) {
        console.error("Error during cleanup:", error);
    }
}


client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('music_')) return; 
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const cooldownKey = `${guildId}-${userId}-${interaction.customId}`;
    
    
    if (client.interactionCooldowns.has(cooldownKey)) {
        return;
    }

    client.interactionCooldowns.set(cooldownKey, Date.now());
    setTimeout(() => {
        client.interactionCooldowns.delete(cooldownKey);
    }, 800); 

    const player = client.riffy.players.get(guildId);
    

    if (!interaction.member.voice.channel) {
        return interaction.reply({ content: "❌ You need to be in a voice channel!", ephemeral: true });
    }

    if (!player) {
        return interaction.reply({ content: "❌ No music player found!", ephemeral: true });
    }

    if (interaction.member.voice.channel.id !== interaction.guild.members.me.voice.channel?.id) {
        return interaction.reply({ content: "❌ You need to be in the same voice channel as the bot!", ephemeral: true });
    }

    try {
        let responseContent = null;
        let shouldUpdate = false;

        switch (interaction.customId) {
            case 'music_pause':
                if (player.playing && !player.paused) {
                    player.pause(true);
                    responseContent = "⏸️ **Music paused!**";
                } else if (player.paused) {
                    responseContent = "❌ **Music is already paused!**";
                } else {
                    responseContent = "❌ **Nothing is playing!**";
                }
                break;

            case 'music_resume':
                if (player.paused) {
                    player.pause(false);
                    responseContent = "▶️ **Music resumed!**";
                } else if (player.playing) {
                    responseContent = "❌ **Music is already playing!**";
                } else {
                    responseContent = "❌ **Nothing to resume!**";
                }
                break;

            case 'music_skip':
                if (player.current) {
                    const skippedTrack = player.current.info.title || "Unknown";
                    player.stop();
                    responseContent = `⏭️ **Skipped:** \`${skippedTrack}\``;
                } else {
                    responseContent = "❌ **Nothing to skip!**";
                }
                break;

            case 'music_clear':
                if (player.queue.size > 0) {
                    const clearedCount = player.queue.size;
                    player.queue.clear();
                    responseContent = `🗑️ **Cleared ${clearedCount} songs!**`;
                } else {
                    responseContent = "❌ **Queue is already empty!**";
                }
                break;

            case 'music_leave':
                responseContent = "🚪 **Left voice channel!**";
                await cleanupPlayer(guildId, "Leave button");
                break;

            case 'music_shuffle':
                if (player.queue.size > 1) {
                    const queue = [...player.queue];
                    for (let i = queue.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [queue[i], queue[j]] = [queue[j], queue[i]];
                    }
                    player.queue.clear();
                    queue.forEach(track => player.queue.add(track));
                    responseContent = `🔀 **Shuffled ${queue.length} songs!**`;
                } else {
                    responseContent = "❌ **Need at least 2 songs to shuffle!**";
                }
                break;

            case 'music_repeat':
                const loopModes = ["none", "track", "queue"];
                let currentIndex = loopModes.indexOf(player.loop || "none");
                currentIndex = (currentIndex + 1) % loopModes.length;
                const newMode = loopModes[currentIndex];
                
                player.setLoop(newMode);
                const modeEmoji = newMode === "track" ? "🔂" : newMode === "queue" ? "🔁" : "➡️";
                const modeText = newMode === "none" ? "Disabled" : newMode === "track" ? "Current Track" : "Queue";
                
                responseContent = `${modeEmoji} **Repeat:** ${modeText}`;
                break;

            case 'music_queue':
                const queueEmbed = await createQueueEmbed(player);
                return interaction.reply({ embeds: [queueEmbed], ephemeral: true });

            case 'music_volume_up':
                if (player.volume < 200) {
                    const newVolume = Math.min(200, player.volume + 10);
                    player.setVolume(newVolume);
                    responseContent = `🔊 **Volume:** ${newVolume}%`;
                } else {
                    responseContent = "❌ **Volume already at maximum (200%)!**";
                }
                break;

            case 'music_volume_down':
                if (player.volume > 10) {
                    const newVolume = Math.max(10, player.volume - 10);
                    player.setVolume(newVolume);
                    responseContent = `🔉 **Volume:** ${newVolume}%`;
                } else {
                    responseContent = "❌ **Volume already at minimum (10%)!**";
                }
                break;

            default:
                responseContent = "❌ **Unknown button!**";
                break;
        }


        if (responseContent) {
            await interaction.reply({ content: responseContent, ephemeral: true });
        }

   
        if (shouldUpdate && player.current) {
            await updateNowPlayingMessage(player);
        }

    } catch (error) {
        console.error("Button error:", error);
        try {
            await interaction.reply({ content: "❌ **Something went wrong!**", ephemeral: true });
        } catch {}
    }
});

async function createQueueEmbed(player, page = 1) {
    const queue = player.queue;
    const itemsPerPage = 8;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPage = queue.slice(startIndex, endIndex);
    
    const embed = new EmbedBuilder()
        .setColor(config.colors.info || "#0099FF")
        .setAuthor({
            name: "📋 Music Queue",
            iconURL: client.user.displayAvatarURL()
        })
        .setTimestamp()
        .setFooter({
            text: `Page ${page}/${Math.ceil(queue.length / itemsPerPage)} • ${queue.length} songs`,
            iconURL: client.user.displayAvatarURL()
        });

    if (player.current) {
        embed.addFields({
            name: "🎵 Currently Playing",
            value: `**[${player.current.info.title}](${player.current.info.uri})**\n` +
                   `*${player.current.info.author}* • \`${formatDuration(player.current.info.length)}\`\n` +
                   `Requested by ${player.current.info.requester}`,
            inline: false
        });
    }

    if (queue.length === 0) {
        embed.setDescription("*Queue is empty. Add some music!*");
    } else {
        const queueList = currentPage.map((track, index) => {
            const position = startIndex + index + 1;
            const title = track.info.title.length > 40 ? track.info.title.substring(0, 37) + "..." : track.info.title;
            const author = track.info.author.length > 25 ? track.info.author.substring(0, 22) + "..." : track.info.author;
            return `\`${position}.\` **[${title}](${track.info.uri})**\n` +
                   `*${author}* • \`${formatDuration(track.info.length)}\``;
        }).join('\n\n');

        embed.setDescription(queueList);
    }

    return embed;
}

async function updateNowPlayingMessage(player) {
    const messageInfo = client.nowPlayingMessages.get(player.guildId);
    if (!messageInfo?.message || !player.current) return;

    try {
        const embed = await createNowPlayingEmbed(player.current, player);
        const buttons = createMusicButtons(player);
        const musicCard = await createMusicCard(player.current, player);

        const updatePayload = {
            embeds: [embed],
            components: buttons
        };

        if (musicCard) {
            updatePayload.files = [musicCard];
        }

        await messageInfo.message.edit(updatePayload);
    } catch (error) {
        console.error("Update error:", error);
        client.nowPlayingMessages.delete(player.guildId);
    }
}


function loadCommands(dir = "./commands") {
    if (!fs.existsSync(dir)) {
        console.log(`❌ Commands directory "${dir}" does not exist`);
        return;
    }

    const commandFolders = fs.readdirSync(dir);
    
    for (const folder of commandFolders) {
        const folderPath = path.join(__dirname, dir, folder);
        
        if (!fs.statSync(folderPath).isDirectory()) continue;
        
        console.log(`📁 Loading commands from: ${folder}`);
        
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));
        
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            
            try {
                delete require.cache[require.resolve(filePath)];
                const command = require(filePath);
                
                if (command.name) {
                    client.commands.set(command.name, command);
                    console.log(`✅ Loaded command: ${command.name} from ${folder}/${file}`);
                    
                    if (command.aliases && Array.isArray(command.aliases)) {
                        command.aliases.forEach(alias => {
                            client.aliases.set(alias, command.name);
                        });
                    }
                } else {
                    console.log(`❌ Error loading command from ${folder}/${file}: Missing name property`);
                }
            } catch (error) {
                console.log(`❌ Error loading command from ${folder}/${file}:`, error.message);
            }
        }
    }
}

function loadEvents(dir = "./events") {
    if (!fs.existsSync(dir)) {
        console.log(`❌ Events directory "${dir}" does not exist`);
        return;
    }

    const eventFiles = fs.readdirSync(dir).filter(file => file.endsWith(".js"));
    
    for (const file of eventFiles) {
        try {
            const eventPath = path.join(__dirname, dir, file);
            const event = require(eventPath);
            const eventName = file.split(".")[0];
            
            if (event.once) {
                client.once(eventName, (...args) => event.execute(...args, client));
            } else {
                client.on(eventName, (...args) => event.execute(...args, client));
            }
            console.log(`✅ Loaded event: ${eventName}`);
        } catch (error) {
            console.log(`❌ Error loading event from ${file}:`, error.message);
        }
    }
}


loadCommands();
loadEvents();


client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.content.startsWith(config.prefix)) return;
    
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName));
    
    if (!command) return;
    
    try {
        if (command.voiceChannel && !message.member.voice.channel) {
            return message.reply("❌ You need to be in a voice channel to use this command!");
        }
        
        if (command.sameVoiceChannel) {
            const player = client.riffy.players.get(message.guild.id);
            if (player && message.member.voice.channel.id !== message.guild.members.me.voice.channel.id) {
                return message.reply("❌ You need to be in the same voice channel as the bot!");
            }
        }
        
        await command.execute(message, args, client);
    } catch (error) {
        console.error(`Command error ${commandName}:`, error);
        message.reply("❌ There was an error executing this command!").catch(() => {});
    }
});


client.riffy.on("nodeConnect", node => {
    console.log(`🔗 Node "${node.name}" connected.`);
});

client.riffy.on("nodeError", (node, error) => {
    console.log(`❌ Node "${node.name}" error: ${error.message}`);
});

client.riffy.on("trackStart", async (player, track) => {
    const channel = client.channels.cache.get(player.textChannel);
    if (!channel) return;

    try {
        const embed = await createNowPlayingEmbed(track, player);
        const buttons = createMusicButtons(player);
        const musicCard = await createMusicCard(track, player);
        
        const messagePayload = {
            embeds: [embed],
            components: buttons
        };

        if (musicCard) {
            messagePayload.files = [musicCard];
        }

        const message = await channel.send(messagePayload);
        
        client.nowPlayingMessages.set(player.guildId, {
            message: message,
            channelId: channel.id
        });

    } catch (error) {
        console.error("Now playing error:", error);
        channel.send(`🎵 **Now Playing:** \`${track.info.title}\``).catch(() => {});
    }
});

client.riffy.on("queueEnd", async (player) => {
    if (config.music.autoplay) {
        try {
            await player.autoplay(player);
        } catch (error) {
            console.error("Autoplay error:", error);
            await cleanupPlayer(player.guildId, "Autoplay failed");
        }
    } else {
        await cleanupPlayer(player.guildId, "Queue ended");
        
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning || "#FFCC00")
                .setDescription("🔇 **Queue ended.**")
                .setTimestamp();
            channel.send({ embeds: [embed] }).catch(() => {});
        }
    }
});

client.riffy.on("trackError", async (player, track, error) => {
    console.log(`Track error: ${error.message}`);
    const channel = client.channels.cache.get(player.textChannel);
    if (channel) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.error || "#FF0000")
            .setDescription(`❌ **Error playing:** \`${track.info.title}\``)
            .setTimestamp();
        channel.send({ embeds: [embed] }).catch(() => {});
    }
});

client.riffy.on("playerDisconnect", async (player) => {

    const guildId = player.guildId;
    
  
    const cooldownKeys = Array.from(client.interactionCooldowns.keys());
    cooldownKeys.forEach(key => {
        if (key.startsWith(guildId)) {
            client.interactionCooldowns.delete(key);
        }
    });

  
    const messageInfo = client.nowPlayingMessages.get(guildId);
    if (messageInfo?.message) {
        try {
            await messageInfo.message.delete().catch(() => {});
        } catch (error) {
            //console.log("Could not clean up message:", error.message);
        }
    }
    client.nowPlayingMessages.delete(guildId);
    
    //console.log(`🧹 Player disconnected for guild ${guildId}`);
});


client.on("raw", (d) => {
    if (![GatewayDispatchEvents.VoiceStateUpdate, GatewayDispatchEvents.VoiceServerUpdate].includes(d.t)) return;
    client.riffy.updateVoiceState(d);
});

client.on("voiceStateUpdate", async (oldState, newState) => {
    if (oldState.member?.id === client.user.id && oldState.channel && !newState.channel) {
        await cleanupPlayer(oldState.guild.id, "Bot disconnected");
    }
});

client.on("ready", () => {
    client.riffy.init(client.user.id);
    console.log(`🤖 ${client.user.tag} is online and ready!`);
    console.log(`📊 Serving ${client.guilds.cache.size} guilds with ${client.users.cache.size} users`);
    console.log(`🎵 Loaded ${client.commands.size} commands`);
});


client.on("error", error => {
    console.error("Discord client error:", error);
});

client.login(process.env.TOKEN);
module.exports = client;
