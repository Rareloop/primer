<?php

use Rareloop\Primer\Primer;
use Rareloop\Primer\Renderable\Pattern;
use Rareloop\Primer\Events\Event;
use Rareloop\Primer\Templating\ViewData;

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
    $data->environment = 'development';
});

/**
 * Listen for when new Handlebars objects are created so that we can register any required helpers
 */
Event::listen('handlebars.new', function ($handlebars) {

});

/**
 * Listen for when a View (not pattern template) is about to be rendered
 * view.[viewName] - below example would call when views/pattern.handlebars is loaded
 */
Event::listen('view.pattern', function ($data, $eventId) {
    // $data->id = 'testing';
});

/**
 * A function that calls anytime a pattern is about to be rendered
 * $data has already been merged at this stage
 */
Pattern::composer('elements/forms/input', function ($data) {
    // $data->label = 'boo yah!';
});

/**
 * A function that calls anytime a data for a pattern is loaded
 * Useful for dynamically generating pattern data, e.g. sprites
 * $data has not yet been merged, this is the raw output of the data.json
 */
ViewData::composer('elements/forms/input', function ($data) {
    // $data->label = 'boo yah!';
});

/**
 * Create an instance of Primer
 *
 * @var Primer
 */
// $patternLab = \Rareloop\Primer\Primer::start(__DIR__.'/..', 'Rareloop\Primer\Templating\Handlebars\HandlebarsTemplate');
$patternLab = \Rareloop\Primer\Primer::start(__DIR__.'/..', 'Rareloop\Primer\Templating\Blade\BladeTemplate');

return $patternLab;
