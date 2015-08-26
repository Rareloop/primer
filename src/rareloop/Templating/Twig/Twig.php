<?php namespace Rareloop\Templating\Twig;

use Rareloop\Primer\FileSystem;
// use Rareloop\Primer\Templating\Handlebars\Helpers\Inc;
use Rareloop\Primer\Events\Event;
use Rareloop\Primer\Primer;

class Twig extends \Twig_Environment
{

    private static $_instance;

    /**
     * Handlebars engine constructor
     * $options array can contain :
     * helpers        => Helpers object
     * escape         => a callable function to escape values
     * escapeArgs     => array to pass as extra parameter to escape function
     * loader         => Loader object
     * partials_loader => Loader object
     * cache          => Cache object
     *
     * @param array $options array of options to set
     *
     * @throws \InvalidArgumentException
     */
    public function __construct(array $options = array())
    {
        $loader = new \Twig_Loader_Filesystem(Primer::$BASE_PATH);

        parent::__construct($loader);

        // Register a helper to include sub patterns
        // $this->getHelpers()->add('inc', new Inc());
    }

    public static function instance()
    {
        if (!isset(self::$_instance)) {
            self::$_instance = new Twig();

            Event::fire('twig.new', self::$_instance);
        }

        return self::$_instance;
    }
}
