<?php namespace Rareloop\Templating\Twig;

// Move into its own file once it works
class IncNode extends \Twig_Node_Include
{
    /**
     * Compiles the node to PHP.
     *
     * @param Twig_Compiler $compiler A Twig_Compiler instance
     */
    public function compile(\Twig_Compiler $compiler)
    {
        $compiler->addDebugInfo($this);
        if ($this->getAttribute('ignore_missing')) {
            $compiler
                ->write("try {\n")
                ->indent()
            ;
        }
        $this->addGetTemplate($compiler);
        $compiler->write('echo $subTemplate->render(');
        $this->addTemplateArguments($compiler);
        $compiler->raw(");\n");
        if ($this->getAttribute('ignore_missing')) {
            $compiler
                ->outdent()
                ->write("} catch (Twig_Error_Loader \$e) {\n")
                ->indent()
                ->write("// ignore missing template\n")
                ->outdent()
                ->write("}\n\n")
            ;
        }
    }

    protected function addGetTemplate(\Twig_Compiler $compiler)
    {
        $compiler
            ->write('$subTemplate = new Rareloop\Templating\Twig\TwigTemplate("patterns/" . ')
            ->subcompile($this->getNode('expr'))
            ->raw(', "template");')
            ->raw("\n")
         ;
    }

    protected function addTemplateArguments(\Twig_Compiler $compiler)
    {
        // TODO: The below doesn't take into account patterns with parents (e.g. ~)
        // TODO: Also doesn't handle data inheritance properly yet
        $compiler
            ->raw('new Rareloop\Primer\Templating\ViewData(array_merge(')
            ->raw('Rareloop\Primer\FileSystem::getDataForPattern(')
            ->subcompile($this->getNode('expr'))
            ->raw(')')
            ->raw(', ')
            ->raw('$context')
        ;

        if (null !== $this->getNode('variables')) {
            $compiler
                ->raw(', ')
                ->subcompile($this->getNode('variables'))
            ;
        }

        $compiler->raw('))');
    }
}