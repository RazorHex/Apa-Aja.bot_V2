const {
  SlashCommandBuilder,
  PermissionsBitField,
  codeBlock,
  ChannelType,
  EmbedBuilder,
} = require("discord.js");
const model = require("../databaseModel");
const { builder } = require("../utils/builder");
const defaultEmbed = require("../utils/custom.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("init")
    .setDescription(
      "Initializing settings, deploying role dropdown, and start logging error to channel"
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  test: true,

  /**
   *
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    const serverId = await interaction.guildId;
    const server = (await model.findOne({ server: serverId }).exec())
      ? await model.findOne({ server: serverId }).exec()
      : false;

    if (!server) {
      await interaction.reply({
        content: codeBlock(`Failed to find server in database.`),
        ephemeral: true,
      });
      return;
    }

    if (server.roles.length <= 1) {
      await interaction.reply({
        content: codeBlock(`${server.roles.length} Registered role.`),
        ephemeral: true,
      });
      return;
    }

    const { setup, roles } = await server;
    if (!setup.roleChannel) {
      await interaction.reply({
        content: "Role channel undefine, creating new text channel for role",
        ephemeral: true,
      });
    }
    const channelRole = setup.roleChannel
      ? await interaction.guild.channels.fetch(setup.roleChannel)
      : await interaction.guild.channels.create({
          name: "role",
          type: ChannelType.GuildText,
          parent: null,
        });

    const options = roles.map((r) => {
      return {
        label: r.name,
        description: r.description,
        value: r.id,
      };
    });
    const dropD = new builder("role").selectMenu(options, "Choose one role");

    const embedData = {
      title: await interaction.guild.name,
      description: setup.shortDesc ? setup.shortDesc : "Awesome server!",
      url: "https://bit.ly/IqT6zt",
      thumbnail: { url: await interaction.guild.iconURL() },
      footer: { text: "Created whenever bored" },
      fields: server.embed ?? [],
    };

    const embedInit = defaultEmbed.default.embedField;

    embedData.fields.push(
      defaultEmbed.default.embedField.map((dat) => {
        const val = codeBlock(`Owner: ${dat.value.owner}\n`);
        return {
          name: dat.name,
          value: val,
        };
      })
    );
    const fancy = new EmbedBuilder(embedData);

    await channelRole.send({
      embeds: [fancy],
      components: [dropD],
    });

    await interaction.reply({
      content: `New panel deployed on ${channelRole}`,
    });
  },
};
