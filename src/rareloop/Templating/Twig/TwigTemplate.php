<?php namespace Rareloop\Templating\Twig;

use Rareloop\Primer\Templating\Template;
use Rareloop\Templating\Twig\Twig;
use Rareloop\Primer\Primer;
use Rareloop\Primer\Templating\ViewData;


class TwigTemplate extends Template
{
    /**
     * Array of file extensions
     *
     * @var array
     */
    protected $extension = 'twig';

    /**
     * Render this template with the provided data
     *
     * @param  ViewData $data [description]
     * @return [type]       [description]
     */
    public function render($data = null)
    {
        // Ensure that $data is not null
        if(!isset($data)) {
            $data = new ViewData(array());
        }

        // Access the singleton Twig engine
        $engine = Twig::instance();

        // The Twig loader is setup to load from the Primer base path so we need to remove this
        // from the template path so that we have it relative to the base
        $path = str_replace(Primer::$BASE_PATH, '', $this->directory);

        // Render the template
        return $engine->render($path . '/'. $this->filename . '.' . $this->extension, $data->toArray());
    }
}
