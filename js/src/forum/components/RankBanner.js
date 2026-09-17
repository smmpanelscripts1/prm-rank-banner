import Component from 'flarum/common/Component';
import icon from 'flarum/common/helpers/icon';
import classList from 'flarum/common/utils/classList';
import textContrastClass from 'flarum/common/helpers/textContrastClass';
import { rankConfig, rankLabel } from '../helpers/rankConfig';

export default class RankBanner extends Component {
  view() {
    const group = this.attrs.group;
    const cfg = rankConfig(group);
    const name = rankLabel(group, cfg);
    const color = group.color() || '#4b5563';
    const iconName = group.icon();
    const useImage = cfg.mode === 'image' && cfg.imageUrl;

    if (useImage) {
      return (
        <span className={classList('RankBanner', 'RankBanner--image', `RankBanner--group-${group.id()}`)} title={name}>
          <img src={cfg.imageUrl} alt={name} />
        </span>
      );
    }

    return (
      <span
        className={classList('RankBanner', `RankBanner--group-${group.id()}`, textContrastClass(color))}
        style={{ '--rank-bg': color }}
        title={name}
      >
        {iconName ? icon(iconName, { className: 'RankBanner-icon' }) : null}
        <span className="RankBanner-name">{name}</span>
      </span>
    );
  }
}
