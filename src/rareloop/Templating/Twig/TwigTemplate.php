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
    protected $extensions = array('html');

    // public function load($directory, $filename)
    // {
    //     parent::load($directory, $filename);

    //     $template = false;

    //     // Try and resolve the template to a real path
    //     foreach ($this->extensions as $ext) {
    //         // If we've not already found the template then keep looking
    //         if(!$template) {
    //             $path = $directory . '/' . $filename . '.' . $ext;

    //             if(is_file($path)) {
    //                 $template = file_get_contents($path);
    //             }
    //         }
    //     }

    //     if(!$template) {
    //         throw new \Exception('Template can not be found');
    //     }

    //     $this->template = $template;
    // }

    public function render($data = null)
    {
        if(!isset($data)) {
            $data = new ViewData(array());
        }

        $engine = Twig::instance();
        $path = str_replace(Primer::$BASE_PATH, '', $this->directory);
        return $engine->render($path . '/'. $this->filename . '.' . $this->extensions[0], $data->toArray());
    }
}
