<?php namespace Rareloop\Templating\Blade;

use Rareloop\Primer\Templating\Template;
use Rareloop\Templating\Blade\Blade;
use Rareloop\Primer\Primer;
use Rareloop\Primer\Templating\ViewData;


class BladeTemplate extends Template
{
    /**
     * Array of file extensions
     *
     * @var array
     */
    protected $extensions = array('blade.php');

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

        // Access the singleton Blade engine
        $engine = Blade::instance();

        // The Twig loader is setup to load from the Primer base path so we need to remove this
        // from the template path so that we have it relative to the base
        $path = str_replace(Primer::$BASE_PATH, '', $this->directory);

        // Render the template
        return $engine->view()->make($path . '/'. $this->filename)->with($data->toArray())->render();
    }
}
