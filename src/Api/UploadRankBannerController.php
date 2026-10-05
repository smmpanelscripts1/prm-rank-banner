<?php

namespace Prm\RankBanner\Api;

use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Illuminate\Contracts\Filesystem\Factory;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Laminas\Diactoros\Response\JsonResponse;
use Prm\RankBanner\RankSettings;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UploadedFileInterface;
use Psr\Http\Server\RequestHandlerInterface;

class UploadRankBannerController implements RequestHandlerInterface
{
    protected const MAX_BYTES = 1048576;
    protected const MIMES = [
        'image/png' => 'png',
        'image/jpeg' => 'jpg',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
    ];

    public function __construct(
        protected RankSettings $ranks,
        protected Factory $filesystem
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $groupId = (string) Arr::get($request->getQueryParams(), 'id');
        $file = Arr::get($request->getUploadedFiles(), 'banner');

        if (!$groupId || !ctype_digit($groupId)) {
            throw new ValidationException(['banner' => 'Geçersiz rütbe.']);
        }

        if (!$file instanceof UploadedFileInterface || $file->getError() !== UPLOAD_ERR_OK) {
            throw new ValidationException(['banner' => 'Görsel yüklenemedi.']);
        }

        if ($file->getSize() > self::MAX_BYTES) {
            throw new ValidationException(['banner' => 'Görsel 1 MB’dan büyük olamaz.']);
        }

        $mime = $file->getClientMediaType();
        $extension = self::MIMES[$mime] ?? null;

        if (!$extension) {
            throw new ValidationException(['banner' => 'Sadece PNG, JPG, GIF veya WEBP yükleyebilirsin.']);
        }

        $disk = $this->filesystem->disk('flarum-assets');
        $current = $this->ranks->get($groupId);

        if (!empty($current['image']) && $disk->exists($current['image'])) {
            $disk->delete($current['image']);
        }

        $path = 'rank-banners/group-'.$groupId.'-'.Str::lower(Str::random(8)).'.'.$extension;
        $disk->put($path, (string) $file->getStream());

        return new JsonResponse([
            'ranks' => $this->ranks->put($groupId, [
                'mode' => 'image',
                'image' => $path,
            ]),
        ]);
    }
}
