<?php namespace Rareloop\Templating\Twig;

use Rareloop\Primer\FileSystem;
use Rareloop\Templating\Twig\IncTokenParser;
use Rareloop\Primer\Events\Event;
use Rareloop\Primer\Primer;

class Twig extends \Twig_Environment
{
    // Singleton instance
    private static $_instance;

    /**
     * Twig engine constructor
     */
    public function __construct()
    {
        // Setup the loader to look from the base directory
        $loader = new \Twig_Loader_Filesystem(Primer::$BASE_PATH);

        // Create the engine with the correct cache path and set it to 
        // invalidate the cache when a template changes
        parent::__construct($loader, array(
            'cache' => Primer::$BASE_PATH.'/cache',
            'auto_reload' => true,
        ));

        // Register our custom {% inc %} tag
        $this->addTokenParser(new IncTokenParser());
    }

    /**
     * Singleton function
     *
     * @return Twig A singleton instance of the Twig engine
     */
    public static function instance()
    {
        if (!isset(self::$_instance)) {
            self::$_instance = new Twig();

            Event::fire('twig.new', self::$_instance);
        }

        return self::$_instance;
    }
}
