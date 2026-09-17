import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import Button from 'flarum/common/components/Button';
import Switch from 'flarum/common/components/Switch';
import Group from 'flarum/common/models/Group';
import icon from 'flarum/common/helpers/icon';
import classList from 'flarum/common/utils/classList';
import textContrastClass from 'flarum/common/helpers/textContrastClass';
import saveSettings from 'flarum/admin/utils/saveSettings';

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

  return `${app.forum.attribute('assetsBaseUrl')}/${filename}`;
}

export default class RankBannerPage extends ExtensionPage {
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
    const id = String(group.id());
    const cfg = parseRanks()[id] || {};
    const defaultEnabled = id !== Group.MEMBER_ID;

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
    return (
      <div className="ExtensionPage-settings">
        <div className="container">
          <p className="RankBannerAdmin-intro helpText">{app.translator.trans('prm-rank-banner.admin.help')}</p>
          <div className="RankBannerAdmin-list">{this.editableGroups().map((group) => this.rankCard(group))}</div>
        </div>
      </div>
    );
  }

  rankCard(group) {
    const id = String(group.id());
    const draft = this.drafts[id];

    return (
      <div className="RankBannerAdmin-card" key={id}>
        <div className="RankBannerAdmin-card-head">
          <div className="RankBannerAdmin-card-title">
            <h3>{draft.nameSingular || group.nameSingular()}</h3>
          </div>
          <Switch state={draft.enabled} onchange={(value) => this.setDraft(id, 'enabled', value)}>
            {app.translator.trans('prm-rank-banner.admin.show_label')}
          </Switch>
        </div>

        <div className="RankBannerAdmin-preview">
          <span className="RankBannerAdmin-previewLabel">{app.translator.trans('prm-rank-banner.admin.preview_label')}</span>
          {this.preview(draft)}
        </div>

        <div className="RankBannerAdmin-grid">
          <div className="Form-group">
            <label>{app.translator.trans('prm-rank-banner.admin.name_label')}</label>
            <input className="FormControl" value={draft.nameSingular} oninput={(e) => this.setDraft(id, 'nameSingular', e.target.value)} />
          </div>

          <div className="Form-group">
            <label>{app.translator.trans('prm-rank-banner.admin.label_label')}</label>
            <input
              className="FormControl"
              placeholder={draft.nameSingular}
              value={draft.label}
              oninput={(e) => this.setDraft(id, 'label', e.target.value)}
            />
            <p className="helpText">{app.translator.trans('prm-rank-banner.admin.label_help')}</p>
          </div>

          <div className="Form-group">
            <label>{app.translator.trans('prm-rank-banner.admin.color_label')}</label>
            <input className="FormControl" type="color" value={draft.color || '#4b5563'} oninput={(e) => this.setDraft(id, 'color', e.target.value)} />
          </div>

          <div className="Form-group">
            <label>{app.translator.trans('prm-rank-banner.admin.icon_label')}</label>
            <input className="FormControl" value={draft.icon} oninput={(e) => this.setDraft(id, 'icon', e.target.value)} />
            <p className="helpText">{app.translator.trans('prm-rank-banner.admin.icon_help')}</p>
          </div>
        </div>

        <div className="Form-group">
          <label>{app.translator.trans('prm-rank-banner.admin.style_label')}</label>
          <div className="RankBannerAdmin-style">
            <label>
              <input type="radio" name={`rank-style-${id}`} checked={draft.mode === 'default'} onchange={() => this.setDraft(id, 'mode', 'default')} />
              {app.translator.trans('prm-rank-banner.admin.style_default')}
            </label>
            <label>
              <input type="radio" name={`rank-style-${id}`} checked={draft.mode === 'image'} onchange={() => this.setDraft(id, 'mode', 'image')} />
              {app.translator.trans('prm-rank-banner.admin.style_image')}
            </label>
          </div>
        </div>

        <div className="Form-group">
          <label>{app.translator.trans('prm-rank-banner.admin.image_label')}</label>
          <p className="helpText">{app.translator.trans('prm-rank-banner.admin.image_help')}</p>
          <div className="RankBannerAdmin-imageRow">
            <input
              className="RankBannerAdmin-file"
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onchange={(e) => this.upload(group, e.target.files[0], e.target)}
            />
            <Button className="Button" icon="fas fa-upload" loading={!!this.uploading[id]} onclick={(e) => e.target.closest('.Form-group').querySelector('input[type=file]').click()}>
              {app.translator.trans('prm-rank-banner.admin.upload_button')}
            </Button>
            {draft.image ? (
              <Button className="Button Button--danger" icon="fas fa-trash" onclick={() => this.removeImage(group)}>
                {app.translator.trans('prm-rank-banner.admin.remove_image_button')}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="RankBannerAdmin-actions">
          <Button className="Button Button--primary" loading={!!this.saving[id]} onclick={() => this.save(group)}>
            {this.saved[id] ? app.translator.trans('prm-rank-banner.admin.saved') : app.translator.trans('prm-rank-banner.admin.save_button')}
          </Button>
        </div>
      </div>
    );
  }

  preview(draft) {
    const name = (draft.label || '').trim() || draft.nameSingular || '';

    if (draft.mode === 'image' && draft.imageUrl) {
      return (
        <span className="RankBanner RankBanner--image" title={name}>
          <img src={draft.imageUrl} alt={name} />
        </span>
      );
    }

    return (
      <span className={classList('RankBanner', textContrastClass(draft.color || '#4b5563'))} style={{ '--rank-bg': draft.color || '#4b5563' }}>
        {draft.icon ? icon(draft.icon, { className: 'RankBanner-icon' }) : null}
        <span className="RankBanner-name">{name}</span>
      </span>
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
      const id = String(group.id());
      const cfg = ranks[id] || {};

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

    const id = String(group.id());
    const data = new FormData();
    data.append('banner', file);

    this.uploading[id] = true;

    app
      .request({
        method: 'POST',
        url: `${app.forum.attribute('apiUrl')}/prm-rank-banner/ranks/${id}/banner`,
        body: data,
      })
      .then((response) => {
        this.applyPrepared(response.ranks || {});
        this.uploading[id] = false;
        if (input) {
          input.value = '';
        }
        m.redraw();
      })
      .catch(() => {
        this.uploading[id] = false;
        if (input) {
          input.value = '';
        }
        m.redraw();
      });
  }

  removeImage(group) {
    const id = String(group.id());

    app
      .request({
        method: 'DELETE',
        url: `${app.forum.attribute('apiUrl')}/prm-rank-banner/ranks/${id}/banner`,
      })
      .then((response) => {
        this.applyPrepared(response.ranks || {});
        this.drafts[id].mode = 'default';
        m.redraw();
      });
  }

  save(group) {
    const id = String(group.id());
    const draft = this.drafts[id];

    this.saving[id] = true;

    const ranks = parseRanks();
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
      .then(() => {
        this.saving[id] = false;
        this.saved[id] = true;
        m.redraw();
      })
      .catch(() => {
        this.saving[id] = false;
        m.redraw();
      });
  }
}
