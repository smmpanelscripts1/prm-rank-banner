var app = flarum.core.compat['admin/app'] || flarum.core.compat.app;
var ExtensionPage = flarum.core.compat['admin/components/ExtensionPage'];
var Button = flarum.core.compat['common/components/Button'];
var Switch = flarum.core.compat['common/components/Switch'];
var Group = flarum.core.compat['common/models/Group'];
var icon = flarum.core.compat['common/helpers/icon'];
var classList = flarum.core.compat['common/utils/classList'];
var textContrastClass = flarum.core.compat['common/helpers/textContrastClass'];
var saveSettings = flarum.core.compat['admin/utils/saveSettings'];
var m = window.m;

function parseRanks() {
  try {
    return JSON.parse(app.data.settings['prm-rank-banner.ranks'] || '{}') || {};
  } catch (e) {
    return {};
  }
}

function imageUrl(filename) {
  if (!filename) {
    return null;
  }

  if (/^https?:\/\//.test(filename)) {
    return filename;
  }

  return app.forum.attribute('assetsBaseUrl') + '/' + filename;
}

class RankBannerPage extends ExtensionPage {
  oninit(vnode) {
    super.oninit(vnode);
    this.saving = {};
    this.uploading = {};
    this.saved = {};
    this.drafts = {};
    this.editableGroups().forEach((group) => this.resetDraft(group));
  }

  editableGroups() {
    return app.store
      .all('groups')
      .filter((group) => String(group.id()) !== Group.GUEST_ID)
      .sort((a, b) => Number(a.id()) - Number(b.id()));
  }

  resetDraft(group) {
    var id = String(group.id());
    var cfg = parseRanks()[id] || {};
    var defaultEnabled = id !== Group.MEMBER_ID;

    this.drafts[id] = {
      enabled: typeof cfg.enabled === 'boolean' ? cfg.enabled : defaultEnabled,
      mode: cfg.mode === 'image' && (cfg.image || cfg.imageUrl) ? 'image' : 'default',
      label: cfg.label || '',
      image: cfg.image || '',
      imageUrl: cfg.imageUrl || imageUrl(cfg.image),
      nameSingular: group.nameSingular() || '',
      namePlural: group.namePlural() || '',
      color: group.color() || '',
      icon: group.icon() || '',
    };
  }

  content() {
    var page = this;

    return m('div.ExtensionPage-settings', [
      m('div.container', [
        m('p.RankBannerAdmin-intro.helpText', app.translator.trans('prm-rank-banner.admin.help')),
        m(
          'div.RankBannerAdmin-list',
          this.editableGroups().map(function (group) {
            return page.rankCard(group);
          })
        ),
      ]),
    ]);
  }

  rankCard(group) {
    var page = this;
    var id = String(group.id());
    var draft = this.drafts[id];

    return m('div.RankBannerAdmin-card', { key: id }, [
      m('div.RankBannerAdmin-card-head', [
        m('div.RankBannerAdmin-card-title', [m('h3', draft.nameSingular || group.nameSingular())]),
        m(
          Switch,
          {
            state: draft.enabled,
            onchange: function (value) {
              page.setDraft(id, 'enabled', value);
            },
          },
          app.translator.trans('prm-rank-banner.admin.show_label')
        ),
      ]),
      m('div.RankBannerAdmin-preview', [
        m('span.RankBannerAdmin-previewLabel', app.translator.trans('prm-rank-banner.admin.preview_label')),
        this.preview(draft),
      ]),
      m('div.RankBannerAdmin-grid', [
        m('div.Form-group', [
          m('label', app.translator.trans('prm-rank-banner.admin.name_label')),
          m('input.FormControl', {
            value: draft.nameSingular,
            oninput: function (e) {
              page.setDraft(id, 'nameSingular', e.target.value);
            },
          }),
        ]),
        m('div.Form-group', [
          m('label', app.translator.trans('prm-rank-banner.admin.label_label')),
          m('input.FormControl', {
            placeholder: draft.nameSingular,
            value: draft.label,
            oninput: function (e) {
              page.setDraft(id, 'label', e.target.value);
            },
          }),
          m('p.helpText', app.translator.trans('prm-rank-banner.admin.label_help')),
        ]),
        m('div.Form-group', [
          m('label', app.translator.trans('prm-rank-banner.admin.color_label')),
          m('input.FormControl', {
            type: 'color',
            value: draft.color || '#4b5563',
            oninput: function (e) {
              page.setDraft(id, 'color', e.target.value);
            },
          }),
        ]),
        m('div.Form-group', [
          m('label', app.translator.trans('prm-rank-banner.admin.icon_label')),
          m('input.FormControl', {
            value: draft.icon,
            oninput: function (e) {
              page.setDraft(id, 'icon', e.target.value);
            },
          }),
          m('p.helpText', app.translator.trans('prm-rank-banner.admin.icon_help')),
        ]),
      ]),
      m('div.Form-group', [
        m('label', app.translator.trans('prm-rank-banner.admin.style_label')),
        m('div.RankBannerAdmin-style', [
          m('label', [
            m('input', {
              type: 'radio',
              name: 'rank-style-' + id,
              checked: draft.mode === 'default',
              onchange: function () {
                page.setDraft(id, 'mode', 'default');
              },
            }),
            ' ' + app.translator.trans('prm-rank-banner.admin.style_default'),
          ]),
          m('label', [
            m('input', {
              type: 'radio',
              name: 'rank-style-' + id,
              checked: draft.mode === 'image',
              onchange: function () {
                page.setDraft(id, 'mode', 'image');
              },
            }),
            ' ' + app.translator.trans('prm-rank-banner.admin.style_image'),
          ]),
        ]),
      ]),
      m('div.Form-group', [
        m('label', app.translator.trans('prm-rank-banner.admin.image_label')),
        m('p.helpText', app.translator.trans('prm-rank-banner.admin.image_help')),
        m('div.RankBannerAdmin-imageRow', [
          m('input.RankBannerAdmin-file', {
            type: 'file',
            accept: 'image/png,image/jpeg,image/gif,image/webp',
            onchange: function (e) {
              page.upload(group, e.target.files[0], e.target);
            },
          }),
          m(
            Button,
            {
              className: 'Button',
              icon: 'fas fa-upload',
              loading: !!this.uploading[id],
              onclick: function (e) {
                e.target.closest('.Form-group').querySelector('input[type=file]').click();
              },
            },
            app.translator.trans('prm-rank-banner.admin.upload_button')
          ),
          draft.image
            ? m(
                Button,
                {
                  className: 'Button Button--danger',
                  icon: 'fas fa-trash',
                  onclick: function () {
                    page.removeImage(group);
                  },
                },
                app.translator.trans('prm-rank-banner.admin.remove_image_button')
              )
            : null,
        ]),
      ]),
      m('div.RankBannerAdmin-actions', [
        m(
          Button,
          {
            className: 'Button Button--primary',
            loading: !!this.saving[id],
            onclick: function () {
              page.save(group);
            },
          },
          this.saved[id] ? app.translator.trans('prm-rank-banner.admin.saved') : app.translator.trans('prm-rank-banner.admin.save_button')
        ),
      ]),
    ]);
  }

  preview(draft) {
    var name = (draft.label || '').trim() || draft.nameSingular || '';

    if (draft.mode === 'image' && draft.imageUrl) {
      return m('span.RankBanner.RankBanner--image', { title: name }, [m('img', { src: draft.imageUrl, alt: name })]);
    }

    return m(
      'span',
      {
        className: classList('RankBanner', textContrastClass(draft.color || '#4b5563')),
        style: { '--rank-bg': draft.color || '#4b5563' },
      },
      [draft.icon ? icon(draft.icon, { className: 'RankBanner-icon' }) : null, m('span.RankBanner-name', name)]
    );
  }

  setDraft(id, key, value) {
    this.drafts[id][key] = value;
    this.saved[id] = false;
    m.redraw();
  }

  applyPrepared(ranks) {
    app.data.settings['prm-rank-banner.ranks'] = JSON.stringify(ranks);

    this.editableGroups().forEach((group) => {
      var id = String(group.id());
      var cfg = ranks[id] || {};

      if (this.drafts[id]) {
        this.drafts[id].image = cfg.image || '';
        this.drafts[id].imageUrl = cfg.imageUrl || imageUrl(cfg.image);
        if (cfg.mode) {
          this.drafts[id].mode = cfg.mode;
        }
      }
    });
  }

  upload(group, file, input) {
    if (!file) {
      return;
    }

    var page = this;
    var id = String(group.id());
    var data = new FormData();
    data.append('banner', file);
    this.uploading[id] = true;

    app
      .request({
        method: 'POST',
        url: app.forum.attribute('apiUrl') + '/prm-rank-banner/ranks/' + id + '/banner',
        body: data,
      })
      .then(function (response) {
        page.applyPrepared(response.ranks || {});
        page.uploading[id] = false;
        if (input) {
          input.value = '';
        }
        m.redraw();
      })
      .catch(function () {
        page.uploading[id] = false;
        if (input) {
          input.value = '';
        }
        m.redraw();
      });
  }

  removeImage(group) {
    var page = this;
    var id = String(group.id());

    app
      .request({
        method: 'DELETE',
        url: app.forum.attribute('apiUrl') + '/prm-rank-banner/ranks/' + id + '/banner',
      })
      .then(function (response) {
        page.applyPrepared(response.ranks || {});
        page.drafts[id].mode = 'default';
        m.redraw();
      });
  }

  save(group) {
    var page = this;
    var id = String(group.id());
    var draft = this.drafts[id];
    this.saving[id] = true;

    var ranks = parseRanks();
    ranks[id] = {
      enabled: !!draft.enabled,
      mode: draft.mode,
      label: draft.label || '',
      image: draft.image || null,
    };

    Promise.all([
      group.save({
        nameSingular: draft.nameSingular,
        namePlural: draft.namePlural || draft.nameSingular,
        color: draft.color,
        icon: draft.icon,
      }),
      saveSettings({
        'prm-rank-banner.ranks': JSON.stringify(ranks),
      }),
    ])
      .then(function () {
        page.saving[id] = false;
        page.saved[id] = true;
        m.redraw();
      })
      .catch(function () {
        page.saving[id] = false;
        m.redraw();
      });
  }
}

app.initializers.add('prm-rank-banner', function () {
  app.extensionData.for('prm-rank-banner').registerPage(RankBannerPage);
});

module.exports = {};
