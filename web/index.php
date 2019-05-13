<?php

require __DIR__ . '/../vendor/autoload.php';

use App\Responses\Error404Response;
use App\Responses\Error500Response;
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
use Symfony\Component\Debug\Debug;
use Twig\Environment;
use Twig\Loader\ChainLoader;
use Twig\Loader\FilesystemLoader;
use Twig\TwigFilter;
use Zend\Diactoros\ServerRequest;
use Zend\Diactoros\ServerRequestFactory;
use function Http\Response\send;

/**
 * Load Config
 */
$appConfig = require __DIR__ . '/../config/app.php';
$patternLoadPaths = require __DIR__ . '/../config/paths.patterns.php';
$templateLoadPaths = require __DIR__ . '/../config/paths.templates.php';
$documentLoadPaths = require __DIR__ . '/../config/paths.docs.php';
$viewLoadPaths = require __DIR__ . '/../config/paths.views.php';

/**
 * Setup exception handling
 */
if ($appConfig['debug'] ?? false) {
    // Pretty print exceptions
    Debug::enable();
} else {
    // Catch exceptions and output our error template
    set_exception_handler(function ($e) use ($viewLoadPaths) {
        error_log($e->getMessage());
        $twig = new Environment(new FilesystemLoader($viewLoadPaths));
        send(new Error500Response($twig->render('primer-500.twig')));
    });
}

/**
 * Create the app container
 */
$container = new Container;

/**
 * Create the Pattern & Template Providers and bind into the Container
 */
$patternsProvider = new FileSystemPatternProvider($patternLoadPaths, 'twig', new JSONDataParser);
$templatesProvider = new FileSystemPatternProvider($templateLoadPaths, 'twig', new JSONDataParser);

$container->set('patternsProvider', $patternsProvider);
$container->set('templatesProvider', $templatesProvider);

/**
 * Create a Twig instance that makes use of the Pattern & Template Providers
 */
$twig = new Environment(
    new ChainLoader(
        [
            new FilesystemLoader($viewLoadPaths),
            new PrimerLoader($patternsProvider),
            new PrimerLoader($templatesProvider),
        ]
    ),
    [
        'debug' => $appConfig['debug'] ?? false,
    ]
);

/**
 * Add a filter to ensure we get sane HTML layout output
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
$response = $router->match(
    ServerRequestFactory::fromGlobals(
        $_SERVER,
        $_GET,
        $_POST,
        $_COOKIE,
        $_FILES
    )
);

if ($response instanceof Error404Response) {
    $response = new Error404Response($twig->render('primer-404.twig'));
}

send($response);
