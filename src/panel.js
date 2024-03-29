const {
  SlashCommandBuilder,
  PermissionsBitField,
  codeBlock,
  EmbedBuilder,
} = require("discord.js");
const model = require("../databaseModel");
const builder = require("../utils/builder");

module.exports = {
  help: {
    function: "Display a panel containing information about server.",
    command: "/panel",
    required: "database",
  },
  data: new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Display the panel.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  /**
   *
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    const owner = await interaction.guild.fetchOwner();
    const allMember = await interaction.guild.members.cache;
    const humanMember = allMember.filter((member) => !member.user.bot);
    const botMember = allMember.filter((member) => member.user.bot);
    const serverData = await interaction.guild;
    const serverId = await interaction.guildId;
    const server = (await model.findOne({ server: serverId }).exec()) ?? false;
    let drop = null;
    if (server) {
      const roles = server.roles.map((role) => {
        return {
          label: role.name,
          description: role.description,
          value: role.id,
        };
      });

      roles.length > 1
        ? (drop = new builder("role").selectMenu(roles, "Select your role..."))
        : false;
    }

    const fancy = new EmbedBuilder()
      .setTitle(serverData.name)
      .setThumbnail(serverData.iconURL())
      .setDescription(server.setup.shortDesc ?? "Welcome to our lovely server.")
      .setFooter({
        text: "type /help for more help",
        iconURL: serverData.iconURL(),
      });

    fancy.addFields(
      server.embed.map((arr) => {
        return {
          name: arr.name,
          value: codeBlock(arr.value),
          inline: arr.inline,
        };
      }) ?? null
    );

    fancy.addFields({
      name: "__*INFORMATION*__",
      value: codeBlock(
        `Owner  : ${owner.user.username}\nMember : ${humanMember.size}\nBot\t: ${botMember.size}\nTotal Member: ${allMember.size}`
      ),
      inline: false,
    });

    if (drop) {
      await interaction.reply({
        embeds: [fancy],
        components: [drop],
      });
    } else {
      await interaction.reply({
        embeds: [fancy],
      });
    }
  },
};
