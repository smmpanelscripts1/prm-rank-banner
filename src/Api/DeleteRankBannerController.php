<?php

namespace Prm\RankBanner\Api;

use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Illuminate\Contracts\Filesystem\Factory;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\JsonResponse;
use Prm\RankBanner\RankSettings;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class DeleteRankBannerController implements RequestHandlerInterface
{
    public function __construct(
        protected RankSettings $ranks,
        protected Factory $filesystem
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $groupId = (string) Arr::get($request->getQueryParams(), 'id');

        if (!$groupId || !ctype_digit($groupId)) {
            throw new ValidationException(['banner' => 'Geçersiz rütbe.']);
        }

        $disk = $this->filesystem->disk('flarum-assets');
        $current = $this->ranks->get($groupId);

        if (!empty($current['image']) && $disk->exists($current['image'])) {
            $disk->delete($current['image']);
        }

        return new JsonResponse([
            'ranks' => $this->ranks->put($groupId, [
                'mode' => 'default',
                'image' => null,
            ]),
        ]);
    }
}
