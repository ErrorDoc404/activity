const { Client, Collection, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const Logger = require("./Logger");
const logger = new Logger();
const ConfigFetcher = require('../config');
const fs = require('fs');
const mongoose = require('mongoose');
const GuildConfig = require("../mongoose/database/schemas/GuildConfig");
const play = require('../music/play.js');
const { Manager } = require("erela.js");
const deezer = require("erela.js-deezer");
const Spotify = require("erela.js-spotify");
const apple = require("erela.js-apple");
const facebook = require("erela.js-facebook");

class DiscordActivityBot extends Client {

  constructor(props = {intents: [32767]}){
      super(props);

      this.config = ConfigFetcher;

      this.musicMessage = [];

      this.skipSong = [];
      this.skipBy = [];

      this.SlashCommands = new Collection();
      this.Commands = new Collection();
      this.CommandsRan = 0;
      this.Buttons = new Collection();

      this.LoadEvents();
      this.LoadButtons();

      this.Commands.set('play', play);

      var client = this;

      // Lavasfy
      // this.Lavasfy = new LavasfyClient(
      //   {
      //     clientID: this.config.Spotify.ClientID,
      //     clientSecret: this.config.Spotify.ClientSecret,
      //     playlistLoadLimit: 100,
      //     audioOnlyResults: true,
      //     autoResolve: true,
      //     useSpotifyMetadata: true
      //   },
      //   [
      //     {
      //       id: this.config.lavalink.id,
      //       host: this.config.lavalink.host,
      //       port: this.config.lavalink.port,
      //       password: this.config.lavalink.pass,
      //     },
      //   ]
      // );

      // Initiate the Manager with some options and listen to some events.
      this.manager = new Manager({
        autoPlay: true,
        // plugins
        plugins: [
          new deezer(),
          new Spotify({
            clientID: this.config.Spotify.ClientID,
            clientSecret: this.config.Spotify.ClientSecret
          }),
          new apple(),
          new facebook(),
        ],
        // Pass an array of node.
        nodes: [this.config.lavalink],
        // A send method to send data to the Discord WebSocket using your library.
        // Getting the shard for the guild and sending the data to the WebSocket.
        send(id, payload) {
          const guild = client.guilds.cache.get(id);
          if (guild) guild.shard.send(payload);
        }
      }).on("nodeConnect", node => logger.commands(`Node ${node.options.identifier} connected`))
        .on("nodeError", (node, error) => logger.error(`Node ${node.options.identifier} had an error: ${error.message}`))
        .on("trackStart", (player, track) => {
          let content;
          const musicMsg = client.musicMessage[player.guild];
          if(player.queue.length == 0)
            content = `**[ Now Playing ]**\n${track.title}.`;
          else {
            content = `\n**[ Now Playing ]**\n${track.title}.\n**[ ${player.queue.length} Songs in Queue ]**`;
            musicMsg.edit({content: content});
          };
          const musicEmbed = musicMsg.embeds[0];
          const thumbnail = track.thumbnail ? track.thumbnail.replace('default', 'hqdefault') : 'https://c.tenor.com/eDVrPUBkx7AAAAAd/anime-sleepy.gif';
          const msgEmbed = {
              title: track.title,
              color: 0xd43790,
              image: {
                url: thumbnail,
              },
              thumbnail: {
                url: track.thumbnail,
              },
              footer: {
                text: `🔊 Volume: ${player.volume}`,
                 iconURL: `${client.user.avatarURL()}`,
             },
            };
          const playEmbed = new MessageEmbed(msgEmbed);
          playEmbed.addField(`Requested By`, `${track.requester.username}`, true);
          if(client.skipSong[player.guild] && client.skipBy[player.guild]) {
            playEmbed.addField(`Skip By`, `${client.skipBy[player.guild].username}`, true);
            client.skipSong[player.guild] = false;
            client.skipBy[player.guild] = false;
          }
          musicMsg.edit({content: content, embeds: [playEmbed]});
        })
        .on("queueEnd", (player) => {
          const musicMsg = client.musicMessage[player.guild];
          client.skipSong[player.guild] = false;
          client.skipBy[player.guild] = false;
          let description = null;
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

          musicMsg.edit({content: `**[ Nothing Playing ]**\nJoin a voice channel and queue songs by name or url in here.`, embeds: [embed], components: [row]});

          player.destroy();
        });

  }

  log(Text){
      logger.log(Text);
  }

  warn(Text){
      logger.warn(Text);
  }

  error(Text){
      logger.error(Text);
  }

  LoadEvents(){
    fs.readdir('./events/', async (err, files) => {
      if (err) return console.error(err);
      files.forEach(file => {
        if (!file.endsWith('.js')) return;
        const evt = require(`../events/${file}`);
        let evtName = file.split('.')[0];
        this.on(evtName, evt.bind(null, this));
        logger.events(`Loaded event '${evtName}'`);
      });
    });
  }

  LoadButtons(){
    fs.readdir('./buttons/', async (err, files) => {
      if (err) return console.error(err);
      files.forEach(file => {
        if (!file.endsWith('.js')) return;
        const button = require(`../buttons/${file}`)
        let btnName = file.split('.')[0];
        this.Buttons.set(btnName, button);
        logger.log(`Loaded button '${btnName}'`);
      });
    });
  }

  build(token){
    if(token == 'youshallnotpass'){
      this.warn('Server is starting');
      this.login(this.config.Token);

      this.MongooseConnect();
    } else return this.warn(`build token invalid`);
  }

  RegisterSlashCommands(){
    require("./SlashCommand")(this);
  }

  DeRegisterGlobalSlashCommands(){
    require("./DeRegisterSlashGlobalCommands")(this);
  }

  DeRegisterGuildSlashCommands(){
    this.guilds.cache.forEach((guild) => {
      require("./DeRegisterSlashGuildCommands")(this, guild.id);
    });
  }

  MongooseConnect(){
    mongoose.connect(this.config.mongooseURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(data => {
      this.warn(`Connected to ${data.connection.host}:${data.connection.port} database: ${data.connection.name}`);
    })
    .catch(err => {this.warn(err)});
  }

  GetMusic(GuildID) {
    return new Promise(async (res, rej) => {
        const findGuildConfig = await GuildConfig.findOne({guildId: GuildID });
        res(findGuildConfig);
    });
  }
}

module.exports = DiscordActivityBot;
