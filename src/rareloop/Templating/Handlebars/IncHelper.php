<?php namespace Rareloop\Templating\Handlebars;

use Handlebars\Context;
use Handlebars\Helper;
use Handlebars\Template;
use \InvalidArgumentException;
use Rareloop\Templating\Handlebars\HandlebarsTemplate;
use Rareloop\Primer\Primer;
use Rareloop\Primer\Templating\ViewData;
use Rareloop\Primer\FileSystem;
use Rareloop\Primer\Events\Event;

class IncHelper implements Helper
{
    /**
     * Execute the helper
     *
     * @param \Handlebars\Template $template The template instance
     * @param \Handlebars\Context  $context  The current context
     * @param array                $args     The arguments passed the the helper
     * @param string               $source   The source
     *
     * @return mixed
     */
    public function execute(Template $template, Context $context, $args, $source)
    {
        $args = explode(' ', $args);
                    
        if (count($args) > 0) {
            $partialId = $args[0];

            // At the time of writing (30/08/15) Helpers seem to tokenize arguments by splitting on 
            // whitespace characters, which means that quoted strings are not handled correctly.
            // e.g. title='foo bar' => array("title=\'", "bar'")
            // 
            // So we'll recombine the argumnets and do our own splitting
            $paramsString = implode(' ', array_slice($args, 1));

            // Regex: http://stackoverflow.com/questions/2202435/php-explode-the-string-but-treat-words-in-quotes-as-a-single-word
            preg_match_all('/[^\'\s]*\'(?:\\\\.|[^\\\\\'])*\'|\S+/', $paramsString, $params);

            // Dig into the matches to get the list
            $params = $params[0];


            // Get the current context
            $contextFrame = $context->last();

            // Ensure we have the context as an array
            if($contextFrame instanceof ViewData) {
                $contextFrame = $contextFrame->toArray();
            }

            $contextReset = false;
            $customContextData = array();

            // Check if we're asking for a variable in the current context first
            try {
                $partialId = $context->get($partialId, true);
            } catch (InvalidArgumentException $e) {}

            // See if we have a custom context set in the helper which we replace the current context
            if(count($args) === 2) {
                try {
                    $contextFrame = $context->get($args[1], true);
                    $contextReset = true;
                } catch (InvalidArgumentException $e) {}
            }

            // See if we have additional data passed in in the form of pairs
            // Only do if the above test wasn't succesful
            if(!$contextReset && count($params) > 0) {
                foreach($params as $pair) {
                    @list($name, $value) = explode("=", $pair);
                    $value = trim($value, "'");

                    // See if this is a variable and not just a string
                    try {
                        $value = $context->get($value, true);
                    } catch (InvalidArgumentException $e) {}

                    $customContextData[$name] = $value;
                }
            }

            // Get the parent template if this is an alias
            $patternId = $partialId;

            if (strpos($patternId, "~") !== false) {
                $parts = explode("~", $patternId);

                if (count($parts) > 1) {
                    $patternId = $parts[0];
                }
            }

            $template = new HandlebarsTemplate(Primer::$BASE_PATH . '/patterns/' . $patternId, 'template');

            // Get the default data for this pattern
            $defaultData = FileSystem::getDataForPattern($partialId, true);

            // Alias data
            $aliasData = array();

            // Get the filename from the partial id
            $parts = explode('/', $partialId);
            $filename = end($parts);

            // Merge the passed in and default data
            $mergedData = new ViewData(array_replace_recursive((array)$defaultData, $contextFrame, $customContextData));

            Event::fire('pattern.' . $partialId, $mergedData);

            return $template->render($mergedData);
        } else {
            return "";
        }
    }
}