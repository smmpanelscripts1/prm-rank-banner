<?php

namespace Prm\RankBanner;

use Flarum\Settings\SettingsRepositoryInterface;
use Illuminate\Contracts\Filesystem\Factory;
use Illuminate\Support\Arr;

class RankSettings
{
    public const KEY = 'prm-rank-banner.ranks';

    public function __construct(
        protected SettingsRepositoryInterface $settings,
        protected Factory $filesystem
    ) {
    }

    public function all(): array
    {
        return $this->decode($this->settings->get(self::KEY));
    }

    public function prepared(): array
    {
        $ranks = $this->all();
        $disk = $this->filesystem->disk('flarum-assets');

        foreach ($ranks as $id => $config) {
            $image = Arr::get($config, 'image');

            if ($image && $disk->exists($image)) {
                $ranks[$id]['imageUrl'] = $disk->url($image);
            } else {
                unset($ranks[$id]['imageUrl']);
            }
        }

        return $ranks;
    }

    public function get(string $groupId): array
    {
        return Arr::get($this->all(), (string) $groupId, []);
    }

    public function put(string $groupId, array $attributes): array
    {
        $ranks = $this->all();
        $current = Arr::get($ranks, $groupId, []);
        $allowed = Arr::only($attributes, ['enabled', 'mode', 'label', 'image']);

        $ranks[$groupId] = array_merge($current, $allowed);

        $this->settings->set(self::KEY, json_encode($ranks));

        return $this->prepared();
    }

    public function decode(?string $value): array
    {
        if (!$value) {
            return [];
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [];
    }

    public static function prepareFrontend(?string $value): array
    {
        return resolve(self::class)->decodeAndPrepare($value);
    }

    protected function decodeAndPrepare(?string $value): array
    {
        $ranks = $this->decode($value);
        $disk = $this->filesystem->disk('flarum-assets');

        foreach ($ranks as $id => $config) {
            $image = Arr::get($config, 'image');

            if ($image && $disk->exists($image)) {
                $ranks[$id]['imageUrl'] = $disk->url($image);
            }
        }

        return $ranks;
    }
}
