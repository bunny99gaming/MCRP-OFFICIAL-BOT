import { MessageFlags } from 'discord.js';
import { getSession, clearSession, sendBgbbAnnouncement } from '../../../services/bgbbService.js';

export default {
  name: 'bgbb_modal',
  async execute(interaction) {
    const session = getSession(interaction.guildId, interaction.user.id);
    if (!session?.type || !session?.action || !session?.userId) {
      return interaction.reply({ content: 'Your BGBB session expired. Please start again.', flags: MessageFlags.Ephemeral });
    }

    const organization = interaction.fields.getTextInputValue('organization').trim();
    const description = interaction.fields.getTextInputValue('description')?.trim() || '';
    const fromOrganization = session.type === 'curator' && session.action === 'transferred'
      ? interaction.fields.getTextInputValue('from_organization').trim()
      : '';
    const toOrganization = session.type === 'curator' && session.action === 'transferred'
      ? interaction.fields.getTextInputValue('to_organization').trim()
      : '';

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      await sendBgbbAnnouncement(interaction.client, interaction.guild, interaction.user, {
        type: session.type,
        action: session.action,
        user: session.userMention || `<@${session.userId}>`,
        organization,
        fromOrganization,
        toOrganization,
        description,
      });
      clearSession(interaction.guildId, interaction.user.id);
      await interaction.editReply({ content: '✅ BGBB announcement sent successfully.' });
    } catch (error) {
      await interaction.editReply({ content: `❌ ${error.message}` });
    }
  },
};
