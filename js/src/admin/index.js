import app from 'flarum/admin/app';
import RankBannerPage from './components/RankBannerPage';

app.initializers.add('prm-rank-banner', () => {
  app.extensionData.for('prm-rank-banner').registerPage(RankBannerPage);
});
