<?php

namespace App\Controllers;

use App\Responses\Error404Response;
use Rareloop\Primer\Exceptions\PatternNotFoundException;
use Rareloop\Primer\Primer;

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
}
