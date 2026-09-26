import { ChannelType, EmbedBuilder } from 'discord.js';
import { getGuildConfig, updateGuildConfig } from './config/guildConfig.js';
import { logger } from '../utils/logger.js';

const sessions = new Map();

export const BGBB_CONFIG_KEY = 'bgbb';

export function getSessionKey(guildId, userId) {
  return `${guildId}:${userId}`;
}

export function getSession(guildId, userId) {
  return sessions.get(getSessionKey(guildId, userId)) || null;
}

export function setSession(guildId, userId, patch) {
  const key = getSessionKey(guildId, userId);
  const current = sessions.get(key) || {};
  const next = { ...current, ...patch, updatedAt: Date.now() };
  sessions.set(key, next);
  return next;
}

export function clearSession(guildId, userId) {
  sessions.delete(getSessionKey(guildId, userId));
}

export async function getBgbbConfig(client, guildId) {
  const config = await getGuildConfig(client, guildId);
  return {
    leaderChannelId: config.bgbb?.leaderChannelId || null,
    curatorChannelId: config.bgbb?.curatorChannelId || null,
    pingRoleId: config.bgbb?.pingRoleId || null,
    panelChannelId: config.bgbb?.panelChannelId || null,
  };
}

export async function saveBgbbConfig(client, guildId, patch) {
  const current = await getBgbbConfig(client, guildId);
  const next = { ...current, ...patch };
  await updateGuildConfig(client, guildId, { bgbb: next });
  return next;
}

export function buildSetupEmbed(guild, config) {
  const mentionChannel = (id) => id ? `<#${id}>` : '`Not selected`';
  const mentionRole = (id) => id ? `<@&${id}>` : '`Not selected`';

  return new EmbedBuilder()
    .setTitle('🔒 BGBB Configuration')
    .setDescription('Configure the BGBB announcement system. The selected Ping Role is required and will be used automatically in every announcement.')
    .addFields(
      { name: '👑 Leader Announcement Channel', value: mentionChannel(config.leaderChannelId), inline: false },
      { name: '🏛️ Curator Announcement Channel', value: mentionChannel(config.curatorChannelId), inline: false },
      { name: '🔔 Ping Role', value: mentionRole(config.pingRoleId), inline: false },
      { name: '📢 Panel Channel', value: mentionChannel(config.panelChannelId), inline: false },
    )
    .setColor('#5865F2')
    .setFooter({ text: `BGBB • ${guild.name}` });
}

export function buildAnnouncementPanel() {
  return new EmbedBuilder()
    .setTitle('📢 BGBB Announcement Panel')
    .setDescription(
      'Use the selectors below to create a staff announcement.\n\n' +
      '**Leader:** Appointed, Fired, Complete Term\n' +
      '**Curator:** Selected, Fired, Transferred\n\n' +
      'The configured Ping Role will be pinged automatically in every announcement.'
    )
    .setColor('#5865F2');
}

export function formatAnnouncement({ type, action, user, organization, fromOrganization, toOrganization, description, roleId }) {
  let text;

  if (type === 'leader') {
    if (action === 'appointed') {
      text = `${user} has been appointed as the Leader of ${organization}.`;
    } else if (action === 'fired') {
      text = `${user} has been fired from their Leader position of ${organization}.`;
    } else {
      text = `${user} has completed their term as Leader of ${organization}.`;
    }
  } else if (action === 'selected') {
    text = `${user} has been appointed as Curator of ${organization}.`;
  } else if (action === 'fired') {
    text = `${user} has been fired from their Curator position of ${organization}.`;
  } else {
    text = `${user} has been transferred from ${fromOrganization} to ${toOrganization}.`;
  }

  const body = description?.trim()
    ? `${text}\n\nDescription: ${description.trim()}`
    : text;

  return `||<@&${roleId}>||\n**${body}**`;
}

export async function sendBgbbAnnouncement(client, guild, actor, data) {
  const config = await getBgbbConfig(client, guild.id);
  if (!config.pingRoleId) {
    throw new Error('BGBB Ping Role is not configured. Ask an admin to run the secret BGBB setup command.');
  }

  const targetChannelId = data.type === 'leader' ? config.leaderChannelId : config.curatorChannelId;
  if (!targetChannelId) {
    throw new Error(`BGBB ${data.type} announcement channel is not configured.`);
  }

  const channel = await guild.channels.fetch(targetChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    throw new Error('The configured BGBB announcement channel could not be found.');
  }

  const content = formatAnnouncement({ ...data, roleId: config.pingRoleId });
  const sent = await channel.send({
    content,
    allowedMentions: { roles: [config.pingRoleId], users: [] },
  });

  const auditChannelId = (await getGuildConfig(client, guild.id))?.logging?.channels?.audit;
  if (auditChannelId) {
    const auditChannel = await guild.channels.fetch(auditChannelId).catch(() => null);
    if (auditChannel?.isTextBased()) {
      const audit = new EmbedBuilder()
        .setTitle('BGBB Action Log')
        .setColor('#5865F2')
        .addFields(
          { name: 'Staff', value: `${actor.tag} (${actor.id})`, inline: false },
          { name: 'User', value: data.user, inline: true },
          { name: 'Type', value: data.type, inline: true },
          { name: 'Action', value: data.action, inline: true },
          { name: 'Organization', value: data.organization || 'N/A', inline: true },
          { name: 'From', value: data.fromOrganization || 'N/A', inline: true },
          { name: 'To', value: data.toOrganization || 'N/A', inline: true },
          { name: 'Description', value: data.description?.trim() || 'None', inline: false },
        )
        .setTimestamp();
      await auditChannel.send({ embeds: [audit] }).catch(() => {});
    }
  }

  logger.info('BGBB announcement sent', {
    guildId: guild.id,
    actorId: actor.id,
    user: data.user,
    type: data.type,
    action: data.action,
    channelId: sent.channelId,
  });

  return sent;
}
