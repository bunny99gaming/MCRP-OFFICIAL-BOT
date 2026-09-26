import { MessageFlags } from 'discord.js';
import { getBgbbConfig, saveBgbbConfig, buildSetupEmbed, setSession } from '../../../services/bgbbService.js';
import { buildSetupComponents } from '../../../commands/Core/bgbb.js';

function allowed(i) {
  return i.memberPermissions?.has('ManageGuild');
}

export default [
  {
    name: 'bgbb_setup_leader_channel',
    async execute(interaction) {
      if (!allowed(interaction)) return interaction.reply({ content: 'You are not authorized to configure BGBB.', flags: MessageFlags.Ephemeral });
      await saveBgbbConfig(interaction.client, interaction.guildId, { leaderChannelId: interaction.channels.first().id });
      await interaction.update({ embeds: [buildSetupEmbed(interaction.guild, await getBgbbConfig(interaction.client, interaction.guildId))], components: buildSetupComponents() });
    },
  },
  {
    name: 'bgbb_setup_curator_channel',
    async execute(interaction) {
      if (!allowed(interaction)) return interaction.reply({ content: 'You are not authorized to configure BGBB.', flags: MessageFlags.Ephemeral });
      await saveBgbbConfig(interaction.client, interaction.guildId, { curatorChannelId: interaction.channels.first().id });
      await interaction.update({ embeds: [buildSetupEmbed(interaction.guild, await getBgbbConfig(interaction.client, interaction.guildId))], components: buildSetupComponents() });
    },
  },
  {
    name: 'bgbb_setup_ping_role',
    async execute(interaction) {
      if (!allowed(interaction)) return interaction.reply({ content: 'You are not authorized to configure BGBB.', flags: MessageFlags.Ephemeral });
      await saveBgbbConfig(interaction.client, interaction.guildId, { pingRoleId: interaction.roles.first().id });
      await interaction.update({ embeds: [buildSetupEmbed(interaction.guild, await getBgbbConfig(interaction.client, interaction.guildId))], components: buildSetupComponents() });
    },
  },
  {
    name: 'bgbb_setup_panel_channel',
    async execute(interaction) {
      if (!allowed(interaction)) return interaction.reply({ content: 'You are not authorized to configure BGBB.', flags: MessageFlags.Ephemeral });
      await saveBgbbConfig(interaction.client, interaction.guildId, { panelChannelId: interaction.channels.first().id });
      await interaction.update({ embeds: [buildSetupEmbed(interaction.guild, await getBgbbConfig(interaction.client, interaction.guildId))], components: buildSetupComponents() });
    },
  },
  {
    name: 'bgbb_type',
    async execute(interaction) {
      setSession(interaction.guildId, interaction.user.id, { type: interaction.values[0] });
      await interaction.reply({ content: 'Type selected. Now select the action.', flags: MessageFlags.Ephemeral });
    },
  },
  {
    name: 'bgbb_action',
    async execute(interaction) {
      const value = interaction.values[0];
      const type = value.startsWith('leader_') ? 'leader' : 'curator';
      const action = value.replace(`${type}_`, '');
      setSession(interaction.guildId, interaction.user.id, { type, action });
      await interaction.reply({ content: 'Action selected. Select the user, then press Enter Details.', flags: MessageFlags.Ephemeral });
    },
  },
  {
    name: 'bgbb_user',
    async execute(interaction) {
      const user = interaction.users.first();
      if (!user) return interaction.reply({ content: 'No user selected.', flags: MessageFlags.Ephemeral });
      setSession(interaction.guildId, interaction.user.id, { userId: user.id, userMention: `<@${user.id}>` });
      await interaction.reply({ content: `User selected: ${user}`, flags: MessageFlags.Ephemeral });
    },
  },
];
