<?php

// Get just the path part of the request (e.g. ignore querystring params)
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Emulate the functionality of Apache mod_rewrite
if (($uri !== '/' && strpos($uri, '/patterns') !== 0) || is_file(__DIR__.'/'.$uri)) {
    // This is a request for a flat file so don't intercept
    return false;
}

// Route everything else through index.php
include __DIR__ . '/index.php';

