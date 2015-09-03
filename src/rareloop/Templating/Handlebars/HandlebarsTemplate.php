<?php namespace Rareloop\Templating\Handlebars;

use Rareloop\Primer\Templating\Template;
use Rareloop\Templating\Handlebars\Handlebars;
// use \Handlebars\Handlebars;
use Rareloop\Primer\Primer;



class HandlebarsTemplate extends Template
{
    /**
     * Array of file extensions
     *
     * @var array
     */
    protected $extension = 'hbs';

    public function load($directory, $filename)
    {
        parent::load($directory, $filename);

        $template = false;

        $path = $directory . '/' . $filename . '.' . $this->extension;

        if(is_file($path)) {
            $template = file_get_contents($path);
        }

        if(!$template) {
            throw new \Exception('Template can not be found: ' . $directory . '/' . $filename);
        }

        $this->template = $template;
    }

    public function render($data)
    {
        $engine = Handlebars::instance();

        return $engine->render($this->template, $data);
    }
}
