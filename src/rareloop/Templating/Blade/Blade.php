<?php namespace Rareloop\Templating\Blade;

use Philo\Blade\Blade as BladeVendor;
use Rareloop\Primer\Primer;
use Rareloop\Primer\Events\Event;

class Blade extends BladeVendor
{
    // Singleton instance
    private static $_instance;

    /**
     * Twig engine constructor
     */
    public function __construct()
    {
        parent::__construct(Primer::$BASE_PATH, Primer::$BASE_PATH.'/cache');

        // Register our custom {% inc %} tag
        // $this->addTokenParser(new IncTokenParser());


        $this->getCompiler()->extend('Rareloop\Templating\Blade\IncExtension::process');
    }

    /**
     * Singleton function
     *
     * @return Blade A singleton instance of the Blade engine
     */
    public static function instance()
    {
        if (!isset(self::$_instance)) {
            self::$_instance = new Blade();

            Event::fire('blade.new', self::$_instance);
        }

        return self::$_instance;
    }
}
