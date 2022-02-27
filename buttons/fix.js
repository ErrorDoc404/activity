const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");

module.exports = {
  name: 'fix',
  run: async (client, interaction, parms, {MusicDB}) => {
    let player = await client.manager.get(interaction.guildId);
    if(!interaction.member.permissions.has('ADMINISTRATOR')) return interaction.reply({content: `You dont have permission to do that`}).catch(err => {client.error(err)});
    if(player) player.destroy();

    const row = new MessageActionRow().addComponents([
      new MessageButton()
        .setCustomId('pause')
        .setLabel('⏸️ Pause')
        .setStyle('PRIMARY'),
      new MessageButton()
        .setCustomId('skip')
        .setLabel('⏭️ Skip')
        .setStyle('SECONDARY'),
      // new MessageButton()
      //   .setCustomId('loop')
      //   .setLabel('🔁 Loop')
      //   .setStyle('DANGER'),
      new MessageButton()
        .setCustomId('stop')
        .setLabel('⏹️ Stop')
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId('fix')
        .setLabel('⚒️ Repair')
        .setStyle('SECONDARY'),
    ]);

    // const row1 = new MessageActionRow().addComponents([
    //   new MessageButton()
    //     .setCustomId('minvolume')
    //     .setLabel('🔈 Vol -')
    //     .setStyle('SECONDARY'),
    //   new MessageButton()
    //     .setCustomId('addvolume')
    //     .setLabel('🔊 Vol +')
    //     .setStyle('SECONDARY'),
    //   new MessageButton()
    //     .setCustomId('clear')
    //     .setLabel('🗑️ Clear')
    //     .setStyle('SECONDARY'),
    //   new MessageButton()
    //     .setCustomId('grab')
    //     .setLabel('🎣 Grab')
    //     .setStyle('SECONDARY'),
    //   new MessageButton()
    //     .setCustomId('track')
    //     .setLabel('⏭️ Track')
    //     .setStyle('SECONDARY'),
    // ]);

    const embed = {
        title: `🎵 Vibing Music 🎵`,
        description: `Anything you type in this channel will be interpreted as a video title`,
        color: 0xd43790,
        image: {
          url: 'https://c.tenor.com/eDVrPUBkx7AAAAAd/anime-sleepy.gif',
        },
        thumbnail: {
          url: 'https://i.imgur.com/Za8NXjk.png',
        },
        footer: {
          text: `${client.user.username} Music`,
          iconURL: `${client.user.avatarURL()}`,
        },
    };
    client.musicMessage[interaction.guildId] = await interaction.channel.messages.fetch(MusicDB.musicMessageId);
    client.musicMessage[interaction.guildId].edit({content: `**[ Nothing Playing ]**\nJoin a voice channel and queue songs by name or url in here.`, embeds: [embed], components: [row]});
    return interaction.reply({content: `fixed`}).catch(err => {client.error(err)});
  }
}
