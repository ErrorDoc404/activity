const { MessageEmbed } = require("discord.js");
const fetch = require('node-fetch');
const { DiscordTogether } = require('discord-together');


module.exports = {
    name: "sketchheads",
    description: "Starts a YouTube Together session",
    usage: "",
    permissions: {
        channel: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"],
        member: [],
    },
    aliases: [],
    category: "activity",
    SlashCommand: {
        options: [
        ],
    /**
     *
     * @param {import("../structures/DiscordMusicBot")} client
     * @param {import("discord.js").Message} message
     * @param {string[]} args
     * @param {*} param3
     */
        run: async (client, interaction, args, { GuildDB }) => {
            client.discordTogether = new DiscordTogether(client);
            const guild = client.guilds.cache.get(interaction.guildId);
            const member = guild.members.cache.get(interaction.member.user.id);

            if (!member.voice.channel) return interaction.reply("❌ | You must be in a voice channel to use this command.").catch((err)=> {client.warn(err)});
            if(!member.voice.channel.permissionsFor(guild.me).has("CREATE_INSTANT_INVITE")) return interaction.reply("❌ | **Bot doesn't have Create Invite Permission**").catch((err)=> {client.warn(err)});

            client.discordTogether.createTogetherCode(member.voice.channel.id, 'sketchheads').then(async invite => {
                let embed = new MessageEmbed()
                    .setAuthor({name: "Sketch Heads"})
                    .setColor("#FF0000")
                    .setDescription(`
                        You can Play Sketch Heads with your friends in a Voice Channel. Click *Join Sketch Heads* to join in!
                        __**[Join Sketch Heads](${invite.code})**__
                        ⚠ **Note:** This only works in Desktop
                        `)
                return interaction.reply({embeds: [embed]}).catch((err)=> {client.warn(err)});
            });
        },
    },
};
