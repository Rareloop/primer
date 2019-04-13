<?php

namespace App\Controllers;

use App\Responses\Error404Response;
use Rareloop\Primer\Exceptions\PatternNotFoundException;
use Rareloop\Primer\Primer;
use Rareloop\Router\Router;
use Zend\Diactoros\Response\RedirectResponse;

class RootController
{
    public function show(Primer $primer, Router $router)
    {
        $menu = $primer->getMenu();

        $sections = ['documents', 'patterns'];

        foreach ($sections as $sectionName) {
            if (!$menu->hasSection($sectionName)) {
                continue;
            }

            $section = $menu->getSection($sectionName);

            if ($section->count() === 0) {
                continue;
            }

            $url = $router->url($sectionName, [
                'id' => $section->getIds()[0],
            ]);

            return new RedirectResponse($url);
        }

        return new Error404Response;
    }
}
