<?php

require 'vendor/autoload.php';

// Create a Primer instance
$primer = require_once __DIR__.'/bootstrap/start.php';

// Create a router object
$router = new AltoRouter();

/**
 * Match the home page, show the full list of patterns
 */
$router->map('GET', '/', function () use ($primer) {
    $primer->showAllPatterns(!isset($_GET['minimal']));
});

/**
 * Match the routes for showing individual patterns
 */
$router->map('GET', '/patterns/[**:trailing]', function ($ids) use ($primer) {
    // Enable multiple patterns to be displayed, seperated by ':' characters
    $ids = explode(':', $ids);

    // Show the patterns
    $primer->showPatterns($ids, !isset($_GET['minimal']));
});

/**
 * Match the routes for showing specific templates
 */
$router->map('GET', '/templates/[**:trailing]', function ($id) use ($primer) {
    // Show the template
    $primer->showTemplate($id);
});

/**
 * Match the routes for retrieving the list of page templates
 */
$router->map('GET', '/menu', function () use ($primer) {
    // Show the template
    $primer->showMenu();
});

// Match current request url
$match = $router->match();

// Call closure or throw 404 status
if ($match && is_callable($match['target'])) {
    call_user_func_array($match['target'], $match['params']);
} else {
    throw new Exception('A route could not be found to match your request');
}
