<?php

require __DIR__ . '/../vendor/autoload.php';

use DI\Container;
use Gajus\Dindent\Indenter;
use Rareloop\Primer\DataParsers\JSONDataParser;
use Rareloop\Primer\DocumentParsers\ChainDocumentParser;
use Rareloop\Primer\DocumentParsers\MarkdownDocumentParser;
use Rareloop\Primer\DocumentParsers\TwigDocumentParser;
use Rareloop\Primer\DocumentParsers\YAMLDocumentParser;
use Rareloop\Primer\FileSystemDocumentProvider;
use Rareloop\Primer\FileSystemPatternProvider;
use Rareloop\Primer\Primer;
use Rareloop\Primer\Twig\MarkdownTwigDocumentRenderer;
use Rareloop\Primer\Twig\MarkdownYamlTwigDocumentParser;
use Rareloop\Primer\Twig\PrimerLoader;
use Rareloop\Primer\Twig\TwigTemplateRenderer;
use Rareloop\Router\Router;
use Twig\Environment;
use Twig\Loader\ChainLoader;
use Twig\Loader\FilesystemLoader;
use Twig\TwigFilter;
use Zend\Diactoros\ServerRequest;
use Zend\Diactoros\ServerRequestFactory;
use function Http\Response\send;

/**
 * Get the load paths from Config
 */
$patternLoadPaths = require __DIR__ . '/../config/paths.patterns.php';
$templateLoadPaths = require __DIR__ . '/../config/paths.templates.php';
$documentLoadPaths = require __DIR__ . '/../config/paths.docs.php';

/**
 * Creat the app container
 */
$container = new Container;

/**
 * Create the Pattern & Template Providers
 */
$patternsProvider = new FileSystemPatternProvider($patternLoadPaths, 'twig', new JSONDataParser);
$templatesProvider = new FileSystemPatternProvider($templateLoadPaths, 'twig', new JSONDataParser);

/**
 * Create a Twig instance that makes use of the Pattern & Template Providers
 */
$twig = new Environment(
    new ChainLoader(
        [
            new FilesystemLoader([ __DIR__ . '/../views' ]),
            new PrimerLoader($patternsProvider),
            new PrimerLoader($templatesProvider),
        ]
    ),
    [
        'debug' => true,
    ]
);

/**
 * Add a filter to ensure we get sane HTML layout out
 */
$twig->addFilter(new TwigFilter('dindent', function ($html) {
    $indenter = new Indenter();
    return $indenter->indent($html);
}));

/**
 * Create a Document Provider that will parse YAML, Twig and Markdown
 */
$documentsProvider = new FileSystemDocumentProvider(
    $documentLoadPaths,
    'md',
    new ChainDocumentParser(
        [
            new YAMLDocumentParser,
            new TwigDocumentParser($twig),
            new MarkdownDocumentParser
        ]
    )
);

/**
 * Create an instance of Primer and bind it into the Container
 */
$primer = new Primer(
    new TwigTemplateRenderer($twig),
    $patternsProvider,
    $templatesProvider,
    $documentsProvider
);

$container->set(Primer::class, $primer);

/**
 * Create a Router to handle the requests and bind it into the Container
 */
$router = new Router($container);
$container->set(Router::class, $router);

/**
 * Load the routes
 */
require __DIR__ . '/../routes.php';

/**
 * Handle the request
 */
send(
    $router->match(
        ServerRequestFactory::fromGlobals(
            $_SERVER,
            $_GET,
            $_POST,
            $_COOKIE,
            $_FILES
        )
    )
);
