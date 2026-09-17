import { extend } from 'flarum/common/extend';
import PostUser from 'flarum/forum/components/PostUser';
import UserCard from 'flarum/forum/components/UserCard';
import ReplyPlaceholder from 'flarum/forum/components/ReplyPlaceholder';
import app from 'flarum/forum/app';
import RankBanners from './components/RankBanners';

function flattenChildren(children) {
  if (!children) {
    return [];
  }

  return Array.isArray(children) ? children : [children];
}

function insertAfterClass(vnode, className, child) {
  const queue = [vnode];

  while (queue.length) {
    const node = queue.shift();

    if (!node || typeof node !== 'object') {
      continue;
    }

    const kids = flattenChildren(node.children);

    for (let i = 0; i < kids.length; i++) {
      const current = kids[i];
      const currentClass = current && current.attrs && current.attrs.className;

      if (currentClass && String(currentClass).split(/\s+/).includes(className)) {
        kids.splice(i + 1, 0, child);
        node.children = kids;
        return true;
      }

      queue.push(current);
    }
  }

  return false;
}

export default function addRankBanners() {
  extend(PostUser.prototype, 'userViewItems', function (items, user) {
    if (items.has('postUser-badges')) {
      items.remove('postUser-badges');
    }

    items.add('postUser-ranks', <RankBanners user={user} className="PostUser-ranks" />, 90);
  });

  extend(UserCard.prototype, 'view', function (vnode) {
    insertAfterClass(vnode, 'UserCard-identity', <RankBanners user={this.attrs.user} className="UserCard-ranks" />);
  });

  extend(ReplyPlaceholder.prototype, 'view', function (vnode) {
    if (!app.session.user) {
      return;
    }

    insertAfterClass(vnode, 'PostUser-name', <RankBanners user={app.session.user} className="PostUser-ranks" />);
  });
}
