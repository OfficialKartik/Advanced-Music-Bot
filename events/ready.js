const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`🎵 ${client.user.tag} is now online!`);
        console.log(`📊 Loaded ${client.commands.size} commands`);
        console.log(`🌐 Connected to ${client.guilds.cache.size} servers`);

        async function updatePresence() {
            const activePlayers = Array.from(client.riffy.players.values()).filter(p => p.playing);

            if (activePlayers.length > 0) {
                const player = activePlayers[0];
                if (player.current?.info?.title) {
                    return client.user.setActivity(
                        `🎸 ${player.current.info.title}`,
                        { type: ActivityType.Playing }
                    );
                }
            }

           
            client.user.setPresence({
                activities: [{
                    name: `${client.config.prefix}help | NoteNinja`,
                    type: ActivityType.Listening
                }],
                status: 'online'
            });
        }

      
        updatePresence();

    
        setInterval(updatePresence, 15_000);
    }
};
