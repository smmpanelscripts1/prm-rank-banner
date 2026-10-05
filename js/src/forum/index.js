import app from 'flarum/forum/app';
import addRankBanners from './addRankBanners';

app.initializers.add('prm-rank-banner', () => {
  addRankBanners();
});
