const { EmbedBuilder } = require("discord.js");
const PlayerUtils = require("../../player.js");
const musicIcons = require("../../Emojis/Music.js");

const fetch = require('node-fetch');
global.fetch = fetch;

const { getData, getTracks } = require('spotify-url-info')(fetch);

const requesters = new Map();

/* ─────────────────────────────────────
   🔥 FIX: IDENTIFIER BUILDER (NEW)
   ───────────────────────────────────── */
function buildIdentifier(query) {
    if (/^https?:\/\//.test(query)) return query;
    return `spsearch:${query}`;
}

module.exports = {
    name: "play",
    aliases: ["p"],
    description: "Play a song or playlist (supports Spotify links)",
    usage: "play <song name/URL/Spotify link>",
    voiceChannel: true,

    async execute(message, args, client) {
        if (message.deletable) message.delete().catch(() => { });

        const query = args.join(" ");
        if (!query) return;

        if (!message.member.voice.channel) return;

        const searchingEmbed = new EmbedBuilder()
            .setColor("#ffcc00")
            .setTitle("Searching...")
            .setDescription(`Looking for: **${query}**`)
            .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        const searchMessage = await message.channel.send({ embeds: [searchingEmbed] });

        let player = client.riffy.players.get(message.guild.id);
        if (!player) player = PlayerUtils.createPlayer(client, message);

        try {

            /* ───────── Spotify URLs (UNCHANGED LOGIC) ───────── */
            if (query.includes('spotify.com')) {
                if (query.includes('/playlist/') || query.includes('/album/')) {
                    return await this.handleSpotifyPlaylist(query, player, message, searchMessage, client);
                } else if (query.includes('/track/')) {
                    return await this.handleSpotifyTrack(query, player, message, searchMessage, client);
                }
            }

            /* ───────── FIXED SEARCH CALL ───────── */
            const identifier = buildIdentifier(query);
            const resolve = await PlayerUtils.searchTrack(client, identifier, message.author);

            if (!resolve || !resolve.tracks || resolve.tracks.length === 0) return;

            const track = resolve.tracks[0];
            track.info.requester = message.author;
            player.queue.add(track);

            if (!player.playing && !player.paused) player.play();

            await this.handleTrackEmbed(player, track, message, searchMessage);

        } catch (error) {
            console.error("Play command error:", error);
        }
    },

    /* ───────── Spotify TRACK (FIXED SEARCH ONLY) ───────── */
    async handleSpotifyTrack(query, player, message, searchMessage, client) {
        try {
            const spotifyData = await getData(query);
            const title = spotifyData.name;
            const artist = spotifyData.artists.map(a => a.name).join(', ');
            const searchQuery = `ytmsearch:${title} - ${artist}`;

            const resolve = await PlayerUtils.searchTrack(client, searchQuery, message.author);
            if (!resolve || !resolve.tracks.length) return;

            const track = resolve.tracks[0];
            track.info.requester = message.author;
            player.queue.add(track);

            if (!player.playing && !player.paused) player.play();

            await this.handleTrackEmbed(player, track, message, searchMessage);
        } catch (err) {
            console.error("Spotify track error:", err);
        }
    },

    /* ───────── Spotify PLAYLIST (ONLY SEARCH FIX) ───────── */
    async handleSpotifyPlaylist(query, player, message, searchMessage, client) {
        const tracksData = await getTracks(query);
        if (!tracksData || tracksData.length === 0) return;

        const first = tracksData[0];
        const firstQuery = `ytmsearch:${first.name} - ${first.artists.map(a => a.name).join(', ')}`;

        const firstResolve = await PlayerUtils.searchTrack(client, firstQuery, message.author);
        if (!firstResolve.tracks.length) return;

        const firstTrack = firstResolve.tracks[0];
        firstTrack.info.requester = message.author;
        player.queue.add(firstTrack);

        if (!player.playing && !player.paused) player.play();
        await this.handleTrackEmbed(player, firstTrack, message, searchMessage);

        // Remaining tracks — SAME LOGIC
        this.processRemainingTracks(tracksData.slice(1), player, message, client);
    },

    async processRemainingTracks(tracksData, player, message, client) {
        for (const trackData of tracksData) {
            const search = `ytmsearch:${trackData.name} - ${trackData.artists.map(a => a.name).join(', ')}`;
            const resolve = await PlayerUtils.searchTrack(client, search, message.author);
            if (resolve && resolve.tracks.length) {
                resolve.tracks[0].info.requester = message.author;
                player.queue.add(resolve.tracks[0]);
            }
        }
    },

    async handleTrackEmbed(player, track, message, searchMessage) {
        const embed = new EmbedBuilder()
            .setColor("#00ff00")
            .setAuthor({ name: player.playing ? "Added to Queue" : "Now Playing", iconURL: musicIcons.correctIcon })
            .setTitle(track.info.title)
            .setURL(track.info.uri)
            .setDescription(track.info.author)
            .setFooter({ text: `Requested by ${message.author.username}` })
            .setTimestamp();

        await searchMessage.edit({ embeds: [embed] });
    },

    requesters
};
