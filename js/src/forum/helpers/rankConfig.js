import app from 'flarum/forum/app';
import Group from 'flarum/common/models/Group';

export function rankConfig(group) {
  const ranks = app.forum.attribute('prmRankBanner') || {};

  return ranks[String(group.id())] || {};
}

export function rankLabel(group, config) {
  const cfg = config || rankConfig(group);
  const label = typeof cfg.label === 'string' ? cfg.label.trim() : '';

  return label || group.nameSingular();
}

export function isRankEnabled(group) {
  const id = String(group.id());

  if (id === Group.GUEST_ID) {
    return false;
  }

  const cfg = rankConfig(group);

  if (typeof cfg.enabled === 'boolean') {
    return cfg.enabled;
  }

  return id !== Group.MEMBER_ID && !(typeof group.isHidden === 'function' && group.isHidden());
}
