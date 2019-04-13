<?php

/**
 * Handle Patterns
 */
$router
    ->get('patterns/{id}{state?}', 'App\Controllers\PatternsController@show')
    ->where(['id' => '[\w\-\/]+', 'state' => '~[\w\-]+'])
    ->name('patterns');

/**
 * Handle Templates
 */
$router
    ->get('templates/{id}{state?}', 'App\Controllers\TemplatesController@show')
    ->where(['id' => '[\w\-\/]+', 'state' => '~[\w\-]+'])
    ->name('templates');

/**
 * Handle Documentation
 */
$router
    ->get('docs/{id}', 'App\Controllers\DocsController@show')
    ->where('id', '[\w\-\/]+')
    ->name('documents');

/**
 * Handle root
 */
$router->get('/', 'App\Controllers\RootController@show');
