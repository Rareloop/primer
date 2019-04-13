<?php

namespace App\Controllers;

use App\Responses\Error404Response;
use Rareloop\Primer\Exceptions\PatternNotFoundException;
use Rareloop\Primer\Primer;

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
}
