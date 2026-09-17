import Component from 'flarum/common/Component';
import classList from 'flarum/common/utils/classList';
import rankGroups from '../helpers/rankGroups';
import RankBanner from './RankBanner';

export default class RankBanners extends Component {
  view() {
    const groups = rankGroups(this.attrs.user);

    if (!groups.length) {
      return null;
    }

    return (
      <div className={classList('RankBanners', this.attrs.className)}>
        {groups.map((group) => (
          <RankBanner group={group} key={group.id()} />
        ))}
      </div>
    );
  }
}
