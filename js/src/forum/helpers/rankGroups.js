import { isRankEnabled } from './rankConfig';

export default function rankGroups(user) {
  if (!user || !user.groups) {
    return [];
  }

  return (user.groups() || []).filter((group) => group && isRankEnabled(group));
}
