const { EmbedBuilder } = require("discord.js");

class PlayerUtils {
    static createPlayer(client, message) {
        try {
            const player = client.riffy.createConnection({
                guildId: message.guild.id,
                voiceChannel: message.member.voice.channel.id,
                textChannel: message.channel.id,
                deaf: true
            });
            
            return player;
        } catch (error) {
            console.error("Error creating player:", error);
            return null;
        }
    }

    static async searchTrack(client, query, requester) {
        try {
            const resolve = await client.riffy.resolve({ 
                query: query, 
                requester: requester 
            });
            
            return resolve;
        } catch (error) {
            console.error("Error searching track:", error);
            return null;
        }
    }

    static formatDuration(ms) {
        if (!ms || ms === 0) return "LIVE";
        
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    static createEmbed(color, title, description) {
        return new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setDescription(description)
            .setTimestamp();
    }

    static createNowPlayingEmbed(track, player) {
        const embed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("Now Playing")
            .setDescription(`**[${track.info.title}](${track.info.uri})**\nBy ${track.info.author || "Unknown"}`)
            .addFields(
                { name: "Duration", value: this.formatDuration(track.info.length), inline: true },
                { name: "Volume", value: `${player.volume}%`, inline: true },
                { name: "Queue", value: `${player.queue.size} songs`, inline: true }
            )
            .setFooter({ text: `Requested by ${track.info.requester.username}` })
            .setTimestamp();
        
        if (track.info.thumbnail) {
            embed.setThumbnail(track.info.thumbnail);
        }
        
        return embed;
    }

    static createQueueEmbed(player, page = 1) {
        const queue = player.queue;
        const itemsPerPage = 10;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentPage = queue.slice(startIndex, endIndex);
        
        const embed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("Music Queue")
            .setTimestamp();

        if (player.current) {
            embed.addFields({
                name: "Currently Playing",
                value: `[${player.current.info.title}](${player.current.info.uri})\n${player.current.info.author} - ${this.formatDuration(player.current.info.length)}`
            });
        }

        if (queue.length === 0) {
            embed.setDescription("Queue is empty");
        } else {
            const queueList = currentPage.map((track, index) => {
                const position = startIndex + index + 1;
                return `**${position}.** [${track.info.title}](${track.info.uri})\n${track.info.author} - ${this.formatDuration(track.info.length)}`;
            }).join('\n\n');

            embed.setDescription(queueList);
            embed.setFooter({ 
                text: `Page ${page}/${Math.ceil(queue.length / itemsPerPage)} • ${queue.length} songs` 
            });
        }

        return embed;
    }

    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    static getProgressBar(current, total, length = 20) {
        if (!total || total === 0) return "LIVE STREAM";
        
        const progress = Math.round((current / total) * length);
        const progressBar = "▓".repeat(progress) + "░".repeat(length - progress);
        
        return `${this.formatDuration(current)} ${progressBar} ${this.formatDuration(total)}`;
    }

    static async handlePlaylist(player, tracks, playlistInfo, message) {
        const addedTracks = [];
        
        for (const track of tracks) {
            track.info.requester = message.author;
            player.queue.add(track);
            addedTracks.push(track);
        }

        const totalDuration = addedTracks.reduce((total, track) => total + (track.info.length || 0), 0);

        const embed = new EmbedBuilder()
            .setColor("#00ff00")
            .setTitle("Playlist Added")
            .setDescription(`Added **${addedTracks.length}** tracks from **${playlistInfo.name}**`)
            .addFields(
                { name: "Duration", value: this.formatDuration(totalDuration), inline: true },
                { name: "Requested by", value: message.author.username, inline: true }
            )
            .setTimestamp();

        if (playlistInfo.thumbnail) {
            embed.setThumbnail(playlistInfo.thumbnail);
        }

        await message.channel.send({ embeds: [embed] });
        
        if (!player.playing && !player.paused) {
            return player.play();
        }
    }

    static async handleTrack(player, track, message) {
        track.info.requester = message.author;
        player.queue.add(track);

        const embed = new EmbedBuilder()
            .setColor("#00ff00")
            .setTitle("Track Added")
            .setDescription(`**[${track.info.title}](${track.info.uri})**\nBy ${track.info.author}`)
            .addFields(
                { name: "Duration", value: this.formatDuration(track.info.length), inline: true },
                { name: "Position", value: `${player.queue.size}`, inline: true },
                { name: "Requested by", value: message.author.username, inline: true }
            )
            .setTimestamp();

        if (track.info.thumbnail) {
            embed.setThumbnail(track.info.thumbnail);
        }

        await message.channel.send({ embeds: [embed] });
        
        if (!player.playing && !player.paused) {
            return player.play();
        }
    }
}

module.exports = PlayerUtils;