<?php namespace Rareloop\Templating\Blade;

class IncExtension
{
    public static function process($view, $compiler)
    {
        $pattern = $compiler->createMatcher('inc');

        $replace = '$1
        <?php 
        $expression = array$2;
        $originalPatternId = $expression[0]; 
        $patternId = $expression[0]; 

        $inlineData = count($expression) > 1 ? $expression[1] : array();

        // Get the parent template if this is an alias
        if (strpos($patternId, "~") !== false) {
            $parts = explode("~", $patternId);

            if (count($parts) > 1) {
                $patternId = $parts[0];
            }
        }

        $data = new Rareloop\Primer\Templating\ViewData(array_merge(
            Rareloop\Primer\FileSystem::getDataForPattern($originalPatternId, true), 
            array_except(get_defined_vars(), array(\'__data\', \'__path\')),
            $inlineData
        ));

        $subPattern = new Rareloop\Templating\Blade\BladeTemplate("patterns/" . $patternId, "template"); 
        echo $subPattern->render($data); ?>';

        return preg_replace($pattern, $replace, $view);
    }
}
