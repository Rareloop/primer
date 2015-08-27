<?php namespace Rareloop\Templating\Twig;

use Rareloop\Templating\Twig\TwigTemplate;
use Rareloop\Primer\Primer;

class IncTokenParser extends \Twig_TokenParser_Include
{
    /**
     * Parses a token and returns a node.
     *
     * @param Twig_Token $token A Twig_Token instance
     *
     * @return Twig_NodeInterface A Twig_NodeInterface instance
     */
    public function parse(\Twig_Token $token)
    {
        $expr = $this->parser->getExpressionParser()->parseExpression();
        list($variables, $only, $ignoreMissing) = $this->parseArguments();
        return new IncNode($expr, $variables, $only, $ignoreMissing, $token->getLine(), $this->getTag());
    }

    public function getTag()
    {
        return 'inc';
    }
}