<?php

namespace App\Controllers;

use App\Responses\Error404Response;
use Rareloop\Primer\Exceptions\PatternNotFoundException;
use Rareloop\Primer\Primer;

class TemplatesController
{
    public function show(Primer $primer, $id, $state = 'default')
    {
        $state = trim($state, '~');

        try {
            return $primer->renderTemplate($id, $state);
        } catch (PatternNotFoundException $e) {
            return new Error404Response;
        }
    }
}
