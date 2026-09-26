import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, UserSelectMenuBuilder, MessageFlags } from 'discord.js';
import { getBgbbConfig, buildAnnouncementPanel, getSession, clearSession } from '../../../services/bgbbService.js';

export default [
  {
    name: 'bgbb_setup_send_panel',
    async execute(interaction) {
      if (!interaction.memberPermissions?.has('ManageGuild')) return interaction.reply({ content: 'You are not authorized to configure BGBB.', flags: MessageFlags.Ephemeral });
      const config = await getBgbbConfig(interaction.client, interaction.guildId);
      if (!config.leaderChannelId || !config.curatorChannelId || !config.pingRoleId || !config.panelChannelId) {
        return interaction.reply({ content: 'Please select Leader channel, Curator channel, Ping Role, and Panel Channel first.', flags: MessageFlags.Ephemeral });
      }

      const type = new StringSelectMenuBuilder()
        .setCustomId('bgbb_type')
        .setPlaceholder('Select Leader or Curator')
        .addOptions(
          { label: 'Leader', value: 'leader', emoji: '👑' },
          { label: 'Curator', value: 'curator', emoji: '🏛️' },
        );

      const action = new StringSelectMenuBuilder()
        .setCustomId('bgbb_action')
        .setPlaceholder('Select an action')
        .addOptions(
          { label: 'Leader — Appointed', value: 'leader_appointed' },
          { label: 'Leader — Fired', value: 'leader_fired' },
          { label: 'Leader — Complete Term', value: 'leader_complete_term' },
          { label: 'Curator — Selected', value: 'curator_selected' },
          { label: 'Curator — Fired', value: 'curator_fired' },
          { label: 'Curator — Transferred', value: 'curator_transferred' },
        );

      const user = new UserSelectMenuBuilder()
        .setCustomId('bgbb_user')
        .setPlaceholder('Select User')
        .setMinValues(1).setMaxValues(1);

      const details = new ButtonBuilder()
        .setCustomId('bgbb_details')
        .setLabel('Enter Details')
        .setStyle(ButtonStyle.Primary);

      const target = await interaction.guild.channels.fetch(config.panelChannelId).catch(() => null);
      if (!target?.isTextBased()) return interaction.reply({ content: 'The configured panel channel could not be found.', flags: MessageFlags.Ephemeral });

      await target.send({
        embeds: [buildAnnouncementPanel()],
        components: [
          new ActionRowBuilder().addComponents(type),
          new ActionRowBuilder().addComponents(action),
          new ActionRowBuilder().addComponents(user),
          new ActionRowBuilder().addComponents(details),
        ],
      });

      await interaction.reply({ content: `BGBB panel sent to <#${config.panelChannelId}>.`, flags: MessageFlags.Ephemeral });
    },
  },
  {
    name: 'bgbb_details',
    async execute(interaction) {
      if (!interaction.memberPermissions?.has('ManageGuild')) return interaction.reply({ content: 'You are not authorized to use BGBB.', flags: MessageFlags.Ephemeral });
      const session = getSession(interaction.guildId, interaction.user.id);
      if (!session?.type || !session?.action || !session?.userId) {
        return interaction.reply({ content: 'Select the type, action, and user first.', flags: MessageFlags.Ephemeral });
      }
      const { ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder } = await import('discord.js');
      const modal = new ModalBuilder().setCustomId('bgbb_modal').setTitle('BGBB Announcement');
      const org = new TextInputBuilder().setCustomId('organization').setStyle(TextInputStyle.Short).setPlaceholder('Organization').setRequired(true).setMaxLength(100);
      const orgLabel = new LabelBuilder().setLabel('Organization').setTextInputComponent(org);
      const labels = [orgLabel];

      if (session.type === 'curator' && session.action === 'transferred') {
        const from = new TextInputBuilder().setCustomId('from_organization').setStyle(TextInputStyle.Short).setPlaceholder('Previous organization').setRequired(true).setMaxLength(100);
        const to = new TextInputBuilder().setCustomId('to_organization').setStyle(TextInputStyle.Short).setPlaceholder('New organization').setRequired(true).setMaxLength(100);
        labels.push(new LabelBuilder().setLabel('From Organization').setTextInputComponent(from));
        labels.push(new LabelBuilder().setLabel('To Organization').setTextInputComponent(to));
      }

      const desc = new TextInputBuilder().setCustomId('description').setStyle(TextInputStyle.Paragraph).setPlaceholder('Optional description').setRequired(false).setMaxLength(1000);
      labels.push(new LabelBuilder().setLabel('Description (Optional)').setTextInputComponent(desc));
      modal.addLabelComponents(...labels);
      await interaction.showModal(modal);
    },
  },
];
