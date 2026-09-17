var app = flarum.core.compat['forum/app'];
var extend = flarum.core.compat['common/extend'].extend;
var Component = flarum.core.compat['common/Component'];
var PostUser = flarum.core.compat['forum/components/PostUser'];
var UserCard = flarum.core.compat['forum/components/UserCard'];
var ReplyPlaceholder = flarum.core.compat['forum/components/ReplyPlaceholder'];
var Group = flarum.core.compat['common/models/Group'];
var icon = flarum.core.compat['common/helpers/icon'];
var classList = flarum.core.compat['common/utils/classList'];
var textContrastClass = flarum.core.compat['common/helpers/textContrastClass'];
var m = window.m;

function rankConfig(group) {
  var ranks = app.forum.attribute('prmRankBanner') || {};
  return ranks[String(group.id())] || {};
}

function rankLabel(group, cfg) {
  var label = cfg && typeof cfg.label === 'string' ? cfg.label.trim() : '';
  return label || group.nameSingular();
}

function isRankEnabled(group) {
  var id = String(group.id());

  if (id === Group.GUEST_ID) {
    return false;
  }

  var cfg = rankConfig(group);

  if (typeof cfg.enabled === 'boolean') {
    return cfg.enabled;
  }

  return id !== Group.MEMBER_ID && !(typeof group.isHidden === 'function' && group.isHidden());
}

function rankGroups(user) {
  if (!user || !user.groups) {
    return [];
  }

  return (user.groups() || []).filter(function (group) {
    return group && isRankEnabled(group);
  });
}

class RankBanner extends Component {
  view() {
    var group = this.attrs.group;
    var cfg = rankConfig(group);
    var name = rankLabel(group, cfg);
    var color = group.color() || '#4b5563';
    var iconName = group.icon();

    if (cfg.mode === 'image' && cfg.imageUrl) {
      return m('span', { className: classList('RankBanner', 'RankBanner--image', 'RankBanner--group-' + group.id()), title: name }, [
        m('img', { src: cfg.imageUrl, alt: name }),
      ]);
    }

    return m(
      'span',
      {
        className: classList('RankBanner', 'RankBanner--group-' + group.id(), textContrastClass(color)),
        style: { '--rank-bg': color },
        title: name,
      },
      [iconName ? icon(iconName, { className: 'RankBanner-icon' }) : null, m('span.RankBanner-name', name)]
    );
  }
}

class RankBanners extends Component {
  view() {
    var groups = rankGroups(this.attrs.user);

    if (!groups.length) {
      return null;
    }

    return m(
      'div',
      { className: classList('RankBanners', this.attrs.className) },
      groups.map(function (group) {
        return m(RankBanner, { group: group, key: group.id() });
      })
    );
  }
}

function flattenChildren(children) {
  if (!children) {
    return [];
  }

  return Array.isArray(children) ? children : [children];
}

function insertAfterClass(vnode, className, child) {
  var queue = [vnode];

  while (queue.length) {
    var node = queue.shift();

    if (!node || typeof node !== 'object') {
      continue;
    }

    var kids = flattenChildren(node.children);

    for (var i = 0; i < kids.length; i++) {
      var current = kids[i];
      var currentClass = current && current.attrs && current.attrs.className;

      if (currentClass && String(currentClass).split(/\s+/).indexOf(className) !== -1) {
        kids.splice(i + 1, 0, child);
        node.children = kids;
        return true;
      }

      queue.push(current);
    }
  }

  return false;
}

app.initializers.add('prm-rank-banner', function () {
  extend(PostUser.prototype, 'userViewItems', function (items, user) {
    if (items.has('postUser-badges')) {
      items.remove('postUser-badges');
    }

    items.add('postUser-ranks', m(RankBanners, { user: user, className: 'PostUser-ranks' }), 90);
  });

  extend(UserCard.prototype, 'view', function (vnode) {
    insertAfterClass(vnode, 'UserCard-identity', m(RankBanners, { user: this.attrs.user, className: 'UserCard-ranks' }));
  });

  extend(ReplyPlaceholder.prototype, 'view', function (vnode) {
    if (!app.session.user) {
      return;
    }

    insertAfterClass(vnode, 'PostUser-name', m(RankBanners, { user: app.session.user, className: 'PostUser-ranks' }));
  });
});

module.exports = {};
