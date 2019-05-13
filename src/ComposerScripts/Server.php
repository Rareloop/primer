<?php

namespace App\ComposerScripts;

use Composer\Script\Event;

class Server
{
    public static function run(Event $event) {
        $args = $event->getArguments();

        $port = 8080;

        if (count($args) && is_numeric($args[0])) {
            $port = (int)$args[0];
        }

        $headerText = 'Server created http://localhost:' . $port;
        $headerBorder = implode('', array_fill(0, strlen($headerText), '='));

        echo "\n" . static::buildHeader($port) . "\n\n";

        system('php -S 0.0.0.0:' . $port . ' -t web');
    }

    private static function buildHeader($port) {
        $lines = [];

        $lines[] = 'Primer Server';
        $lines[] = '';
        $lines[] = 'Listening on http://localhost:' . $port;
        $lines[] = 'Press Ctrl-C to quit';

        $longestLineLength = array_reduce($lines, function ($length, $line) {
            return max($length, strlen($line));
        }, 0);

        $headerBorder = implode('', array_fill(0, $longestLineLength, '='));

        array_unshift($lines, $headerBorder);
        $lines[] = $headerBorder;

        return implode("\n", $lines);
    }
}
