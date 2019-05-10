<?php

namespace App\Controllers;

use App\Responses\Error404Response;
use Rareloop\Primer\Exceptions\PatternNotFoundException;
use Rareloop\Primer\Primer;
use Rareloop\Router\Router;
use Zend\Diactoros\Response\RedirectResponse;

class PatternsController
{
    public function show(Primer $primer, $id, $state = 'default')
    {
        $state = trim($state, '~');

        try {
            if (isset($_GET['fullscreen'])) {
                return $primer->renderPatternWithoutChrome($id, $state);
            }

            if ($state !== 'default') {
                return $primer->renderPattern($id, $state);
            }

            return $primer->renderPatterns($id);
        } catch (PatternNotFoundException $e) {
            return new Error404Response;
        }
    }

    public function first(Primer $primer, Router $router)
    {
        $menu = $primer->getMenu();

        if (!$menu->hasSection('patterns')) {
            return new Error404Response;
        }

        $section = $menu->getSection('patterns');

        if ($section->count() === 0) {
            return new Error404Response;
        }

        $url = $router->url('patterns', [
            'id' => $section->getIds()[0],
        ]);

        return new RedirectResponse($url);
    }
}
