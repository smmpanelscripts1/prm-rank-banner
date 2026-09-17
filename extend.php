<?php

namespace Prm\RankBanner;

use Flarum\Extend;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/less/forum.less'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/less/admin.less'),

    new Extend\Locales(__DIR__.'/locale'),

    (new Extend\Routes('api'))
        ->post('/prm-rank-banner/ranks/{id}/banner', 'prm-rank-banner.upload', Api\UploadRankBannerController::class)
        ->delete('/prm-rank-banner/ranks/{id}/banner', 'prm-rank-banner.delete', Api\DeleteRankBannerController::class),

    (new Extend\Settings())
        ->default(RankSettings::KEY, '{}')
        ->serializeToForum('prmRankBanner', RankSettings::KEY, [RankSettings::class, 'prepareFrontend']),
];
