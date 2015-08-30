<?php namespace Rareloop\Templating\Handlebars\Tests;

use Rareloop\Primer\Events\Event;

class PatternTest extends \PHPUnit_Framework_TestCase
{
    protected $primer;

    /**
     * Bootstrap the system
     */
    public function setup()
    {
        $this->primer = \Rareloop\Primer\Primer::start(__DIR__.'/primer-test', '\Rareloop\Templating\Handlebars\HandlebarsTemplate');
    }

    /**
     * The twig template should render
     */
    public function testBasicRender()
    {
        $output = $this->primer->getPatterns(array('components/test-group/basic-pattern'), false);

        $this->assertEquals($output, 'Basic pattern with no data');
    }

    /**
     * A pattern should load data from data.json
     */
    public function testData()
    {
        $output = $this->primer->getPatterns(array('components/test-group/data-autoload'), false);

        $this->assertEquals($output, 'Title autoloaded from data.json');
    }

    /**
     * Include one pattern in another
     */
    public function testCustomIncludeFunction()
    {
        $output = $this->primer->getPatterns(array('components/test-group/include-basic'), false);

        $this->assertEquals($output, 'Basic pattern with no data');
    }

    /**
     * Test when a pattern is included that itself has default data
     */
    public function testCustomIncludeFunctionWithDefaultData()
    {
        $output = $this->primer->getPatterns(array('components/test-group/include-default-data'), false);

        $this->assertEquals($output, 'Title autoloaded from data.json');
    }

    /**
     * Test when a pattern is included that itself has default data but the parent pattern overrides the data
     */
    public function testCustomIncludeFunctionWithOverriddenData()
    {
        $output = $this->primer->getPatterns(array('components/test-group/include-override-data'), false);

        $this->assertEquals($output, 'Data overridden in parent data.json');
    }

    /**
     * Test when a pattern is included that itself has default data but the parent pattern overrides the data
     */
    public function testCustomIncludeFunctionWithInlineData()
    {
        $output = $this->primer->getPatterns(array('components/test-group/include-inline-data'), false);

        $this->assertEquals($output, 'Inlined data');
    }

    /**
     * Test that including an aliased pattern finds the template.twig file from the parent
     */
    public function testCustomIncludeWithAliasedPattern()
    {
        $output = $this->primer->getPatterns(array('components/test-group/include-aliased'), false);

        $this->assertEquals($output, 'Basic pattern with no data');
    }

    /**
     * Test that including an aliased pattern with overridden data works
     */
    public function testCustomIncludeWithAliasedPatternAndOverriddenData()
    {
        $output = $this->primer->getPatterns(array('components/test-group/include-aliased-override-data'), false);

        $this->assertEquals($output, 'Title overridden from child data.json');
    }

    /**
     * Test that including an aliased pattern with inline data works
     */
    public function testCustomIncludeWithAliasedPatternAndInlineData()
    {
        $output = $this->primer->getPatterns(array('components/test-group/include-aliased-inline-data'), false);

        $this->assertEquals($output, 'Inline data');
    }

    /**
     * TODO: Test when there are more than one param passed to a partial
     */
    
    /**
     * TODO: Test when passing a variable to interpolate into a partial (e.g. title=subTitle instead of title='The subtitle')
     */
}
?>