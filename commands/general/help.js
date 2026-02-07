// commands/general/help.js
const { 
    ContainerBuilder,
    SectionBuilder, 
    TextDisplayBuilder,
    ThumbnailBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags
} = require("discord.js");

module.exports = {
    name: "help",
    aliases: ["h", "commands", "cmd"],
    description: "Show all available commands",
    usage: "help [command]",
    category: "General",
    
    async execute(message, args, client) {
      
        if (args[0]) {
            return await showSpecificCommand(message, args[0], client);
        }
        
    
        const helpContainer = createHelpContainer(client, message);
        await message.channel.send({ 
            components: [helpContainer], 
            flags: MessageFlags.IsComponentsV2 
        });
    },
};

async function showSpecificCommand(message, commandName, client) {
    const command = client.commands.get(commandName.toLowerCase()) || 
                   client.commands.get(client.aliases?.get(commandName.toLowerCase()));
    
    if (!command) {
        const errorContainer = new ContainerBuilder()
            .setAccentColor(0xFF4757)
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`# ❌ Command Not Found\nThe command **${commandName}** does not exist`)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`*Use \`${client.config?.prefix || '!'}help\` to see all available commands*`)
            );

        return message.channel.send({ 
            components: [errorContainer], 
            flags: MessageFlags.IsComponentsV2 
        });
    }
    
    const commandContainer = new ContainerBuilder()
        .setAccentColor(0x5865F2)
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(`# 📋 Command: ${command.name}\n${command.description || "No description available"}`)
        )
        .addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(`**📝 Usage:** \`${client.config?.prefix || '!'}${command.usage || command.name}\`\n**🏷️ Aliases:** ${command.aliases && command.aliases.length > 0 ? command.aliases.map(alias => `\`${alias}\``).join(", ") : "None"}\n**📂 Category:** ${command.category || "General"}`)
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder()
                        .setURL(client.user.displayAvatarURL({ dynamic: true }))
                        .setDescription(`${command.name} command information`)
                )
        )
        .addSeparatorComponents(
            new SeparatorBuilder()
                .setSpacing(SeparatorSpacingSize.Small)
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(`*Requested by ${message.author.tag} • ${new Date().toLocaleString()}*`)
        );
    
    return message.channel.send({ 
        components: [commandContainer], 
        flags: MessageFlags.IsComponentsV2 
    });
}

function createHelpContainer(client, message) {
    const categories = getCategories(client);
    const totalCommands = client.commands.size;
    const prefix = client.config?.prefix || '!';
    
    const helpContainer = new ContainerBuilder()
        .setAccentColor(0x5865F2)
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(`# 🎵 Music Bot - Command List\nHere are all **${totalCommands}** available commands.\nUse \`${prefix}help <command>\` for detailed information.`)
        )
        .addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(`**📊 Bot Statistics**\n**Servers:** ${client.guilds.cache.size}\n**Users:** ${client.users.cache.size}\n**Uptime:** ${formatUptime(client.uptime)}\n**Prefix:** \`${prefix}\``)
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder()
                        .setURL(client.user.displayAvatarURL({ dynamic: true }))
                        .setDescription(`${client.user.username} bot avatar`)
                )
        );

  
    helpContainer.addSeparatorComponents(
        new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Large)
    );

   
    Object.keys(categories).forEach((categoryName, index) => {
        const commands = categories[categoryName];
        const commandList = commands
            .map(cmd => `\`${cmd.name}\``)
            .join(" • ");
        
    
        helpContainer.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(`**${getEmoji(categoryName)} ${categoryName} Commands (${commands.length})**\n${commandList || "None loaded"}`)
        );

        
        if (index < Object.keys(categories).length - 1) {
            helpContainer.addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing(SeparatorSpacingSize.Small)
            );
        }
    });


    helpContainer.addSeparatorComponents(
        new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(`*Requested by ${message.author.tag} • ${totalCommands} total commands • ${new Date().toLocaleString()}*`)
    );
    
    return helpContainer;
}

function getCategories(client) {
    const categories = {};
    
    client.commands.forEach(command => {
        const category = command.category || "General";
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(command);
    });
    

    Object.keys(categories).forEach(category => {
        categories[category].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return categories;
}

function getEmoji(category) {
    const emojis = {
        "Music": "🎵",
        "General": "⚙️",
        "Admin": "🛡️",
        "Moderation": "🔨",
        "Fun": "🎉",
        "Utility": "🔧",
        "Information": "📊"
    };
    
    return emojis[category] || "📁";
}

function formatUptime(uptime) {
    if (!uptime) return "Unknown";
    
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}
