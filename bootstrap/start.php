<?php

use Rareloop\Primer\Primer;
use Rareloop\Primer\Renderable\Pattern;
use Rareloop\Primer\Events\Event;
use Rareloop\Primer\Templating\ViewData;
use Rareloop\Primer\Templating\View;

use Rareloop\Primer\TemplateEngine\Twig\Template as TwigTemplateEngine;
use Rareloop\Primer\TemplateEngine\Handlebars\Template as HandlebarsTemplateEngine;

/**
 * Listen for when the CLI is created
 */
Event::listen('cli.init', function ($cli) {
    // Register custom commands here
});

/**
 * Listen for whole page render events
 */
Event::listen('render', function ($data) {
    $data->primer->environment = 'development';
});

/**
 * Listen for when new Handlebars objects are created so that we can register any required helpers
 */
Event::listen('handlebars.init', function ($handlebars) {

});

/**
 * Listen for when a View (not pattern template) is about to be rendered
 * view.[viewName] - below example would call when views/pattern.handlebars is loaded
 */
View::composer('pattern', function ($data, $eventId) {
    // $data->id = 'testing';
});

/**
 * A function that calls anytime a data for a pattern is loaded
 * Useful for dynamically generating pattern data, e.g. sprites
 * $data is the raw output of the data.json
 */
ViewData::composer('elements/forms/input', function ($data, $id, $originalId) {
    // $data->label = 'boo yah!';
});

/**
 * Create an instance of Primer
 *
 * @var Primer
 */
$primer = Primer::start([
    'basePath' => __DIR__.'/..',
    'templateClass' => HandlebarsTemplateEngine::class,
]);

return $primer;
