<?php

namespace App\Controllers;

use App\Responses\Error404Response;
use Rareloop\Primer\Exceptions\DocumentNotFoundException;
use Rareloop\Primer\Exceptions\PatternNotFoundException;
use Rareloop\Primer\Primer;
use Rareloop\Router\Router;
use Zend\Diactoros\Response\RedirectResponse;

class DocsController
{
    public function show(Primer $primer, $id)
    {
        try {
            return $primer->renderDocument($id);
        } catch (DocumentNotFoundException $e) {
            return new Error404Response;
        }
    }

    public function first(Primer $primer, Router $router)
    {
        $menu = $primer->getMenu();

        if (!$menu->hasSection('documents')) {
            return new Error404Response;
        }

        $section = $menu->getSection('documents');

        if ($section->count() === 0) {
            return new Error404Response;
        }

        $url = $router->url('documents', [
            'id' => $section->getIds()[0],
        ]);

        return new RedirectResponse($url);
    }
}
