import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessageFlags,
} from 'discord.js';
import { getBgbbConfig, buildSetupEmbed, saveBgbbConfig } from '../../services/bgbbService.js';

export function buildSetupComponents() {
  const leader = new ChannelSelectMenuBuilder()
    .setCustomId('bgbb_setup_leader_channel')
    .setPlaceholder('Select Leader announcement channel')
    .setMinValues(1).setMaxValues(1)
    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

  const curator = new ChannelSelectMenuBuilder()
    .setCustomId('bgbb_setup_curator_channel')
    .setPlaceholder('Select Curator announcement channel')
    .setMinValues(1).setMaxValues(1)
    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

  const role = new RoleSelectMenuBuilder()
    .setCustomId('bgbb_setup_ping_role')
    .setPlaceholder('Select Ping Role')
    .setMinValues(1).setMaxValues(1);

  const panel = new ChannelSelectMenuBuilder()
    .setCustomId('bgbb_setup_panel_channel')
    .setPlaceholder('Select channel for the BGBB panel')
    .setMinValues(1).setMaxValues(1)
    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

  const send = new ButtonBuilder()
    .setCustomId('bgbb_setup_send_panel')
    .setLabel('Send Panel / Message')
    .setStyle(ButtonStyle.Primary);

  return [
    new ActionRowBuilder().addComponents(leader),
    new ActionRowBuilder().addComponents(curator),
    new ActionRowBuilder().addComponents(role),
    new ActionRowBuilder().addComponents(panel),
    new ActionRowBuilder().addComponents(send),
  ];
}

export async function openBgbbSetupPanel(interaction) {
  if (!interaction.guild) return;
  const config = await getBgbbConfig(interaction.client, interaction.guild.id);
  await interaction.reply({
    embeds: [buildSetupEmbed(interaction.guild, config)],
    components: buildSetupComponents(),
    flags: MessageFlags.Ephemeral,
  });
}

export async function sendBgbbSetupPanelToChannel(message, client) {
  const config = await getBgbbConfig(client, message.guild.id);
  await message.channel.send({
    embeds: [buildSetupEmbed(message.guild, config)],
    components: buildSetupComponents(),
  });
}

export default {
  data: new SlashCommandBuilder()
    .setName('bgbb')
    .setDescription('Configure the BGBB announcement system')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  category: 'Core',
  slashOnly: true,
  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'You need Manage Server permission to use BGBB.', flags: MessageFlags.Ephemeral });
    }
    await openBgbbSetupPanel(interaction);
  },
};
