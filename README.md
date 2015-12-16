# Primer

Primer is a tool to aid with the design & development of a web site/app. It helps focus the design process into a series of reusable components and patterns instead of thinking just about templates.

Primer is: 

- a prototyping tool
- a catalog of all the individual parts that make up your style guide
- a way to isolate/develop a single part of the overall system
- a centralised place for designers, developers and product owners to refer to
- designed to be a living document, ever evolving as your site develops

Primer isn't:

- a front end framework
- opinionated about your front end stack or tooling
- a static site generator

![Primer Screenshot](https://dl.dropboxusercontent.com/u/20572064/primer-screenshot.png)

## Installation

To get started, simply run from the Primer folder:

```bash
composer install
```

## Usage

Out of the box, Primer is setup to run from the root of your domain. You can create a virtual host within Apache or to get up and running straight away run the command:

```bash
php primer serve
```

This will start a standalone server from which you can begin to work in. By default the server starts on port `8080`, if you would like to run from something different you can supply an additional argument:

```bash
php primer serve 8081
```

## Patterns

Patterns are the building blocks of your system and Primer provides a simple way to view your entire catalog, a selection or just a single item. Patterns are located in the `patterns` folder and are broken down into the following types:

- `patterns/elements`: Basic building blocks, e.g. Headers, Form Elements etc
- `patterns/components`: More complex objects that may incorporate many elements

*Typically `elements` are the same/similar from site to site - `components` are more site specific.*

Patterns are then further divided into groups, to allow multiple patterns to be logically grouped. 

**Example:** For an `element` pattern named `input` inside the `forms` group, the path would be:

	[Primer Directory]/patterns/elements/forms/input

### Anatomy of a pattern

Each Pattern has an implicit `id` and `title`. The `id` is the path used to identify it under the patterns folder, e.g. `elements/forms/input`. `id`'s can be used to [show only specific patterns](#showing-only-specific-patterns) instead of the full catalog.

A patterns `title` is built from the name of the pattern's folder, e.g. `elements/lists/ordered-list` => `Ordered List`.

Each folder can have the following files:

- `template.hbs` A Handlebars template used to build the pattern's HTML
- `data.json` *Optional* A JSON object that is passed into the Handlebars template
- `README.md` *Optional* A Markdown formatted text file which can be used to give additional description/notes to the pattern
- `init.php` *Optional* A script containing pattern specific code and event listeners

### Same template, different data

When building any non-trivial design system, its common for elements/components/templates to have multi states. Take for example a login form, which will have a default state and also one or more error states. Primer makes it easy to handle these multiple states using Pattern Aliases, these special pattern instances share `template.hbs` files but load with unique data. 

To make an alias for a pattern with `id` `components/forms/login` you could create `components/forms/login~error`. The Pattern Alias must share the same `id` as the parent pattern but be appended with `~` and a unique name.

### Including patterns within one another

Any pattern can be included within another by using the standard [Handlebars partial syntax](http://handlebarsjs.com/partials.html), e.g.

```html
<div class="sub-pattern">
	{{> elements/forms/input }}
</div>
```

Patterns can be included by the partial helper using their `id` (e.g. `{{> elements/forms/input }}`) but non Primer templates can also be loaded by passing a reference to the file without extension (e.g. `{{> elements/forms/input/test-partial }}`). 

The context passed to the partial can be manipulated in the standard ways possible using Handlebars ([more details](http://handlebarsjs.com/partials.html#partial-context)).

*Pattern Aliases can not be included using the partial syntax*

## Templates

Templates are just special cases of Patterns and are located in the `patterns/templates` folder. With templates, there is no requirement for grouping.

To view a particular template you would use the `template` route, e.g.

```
/template/home
```

Would load the template found in `patterns/templates/home`.

## Views

Views are used to render more Primer specific aspects of the pattern library, for example the chrome surrounding patterns, groups and sections. One exception is `[Primer Directory]/views/template.hbs`, this is used as the base for all Templates that you create and is where you can add/remove assets to be loaded on each page.

## Custom Views

Each page Template can be wrapped in a separate View if required, to change the View add the following to the Template's `data.json` file, e.g.

```
{
	"primer": {
		"view": "custom-view"
	}
}
```

This would then use the view `views/custom-view.hbs` anytime the page template is rendered.

It's also possible to disable the default wrapping of page Templates within a View. *This is more useful when using a template engine that supports inheritance.*

```
{
	"primer": {
	    "wrapTemplate": false
	}
}
```

## Using different template engines

Since `v2.0.0`, Primer supports different template engines beyond just Handlebars. This makes it easier to tailor Primer to your teams template preference and makes it easier to integrate patterns into a backend system/CMS. The following engines are currently implemented:

- [Handlebars](https://github.com/Rareloop/primer-template-engine-handlebars) (default)
- [Twig](https://github.com/Rareloop/primer-template-engine-twig)

## Advanced Usage

### Showing only specific patterns

Multiple patterns/groups can be isolated, enabling a custom list of items to be viewed. To do this seperate the list of pattern/group `id`'s with a `:` character.

```
/patterns/elements/forms/button:elements/forms/input
```

### Using different folders

It's possible to pass more configuration parameters to Primer if you need to use non-standard folder locations (`bootstrap/start.php`):

```php
$primer = Primer::start([
    'basePath' => __DIR__.'/..',
    'templateClass' => HandlebarsTemplateEngine::class,

    'patternPath' => __PATTERN_PATH__,
    'viewPath' => __VIEW_PATH__,
]);
```

### Disable template wrapping for all page templates

To disable page template wrapping in views by default, you can pass another parameter to Primer (`bootstrap/start.php`):

```php
$primer = Primer::start([
    'basePath' => __DIR__.'/..',
    'templateClass' => HandlebarsTemplateEngine::class,

    'wrapTemplate' => false,
]);
```

### Events

Primer is built around an Event system that makes it easier to extend. To listen to an event you simply need to call:

```php
Event::listen('eventname', function () {
    // Do stuff here
});
```

`bootstrap/start.php` contains some examples of events but for completeness here is a list:

- #### CLI Initialisation

	Called when the CLI instance is created. This is useful for extending the CLI with custom commands.

	```php
	Event::listen('cli.init', function ($cli) {
	    $cli->add(new \App\Commands\Export);
	});
	```

	Commands need to extend Symfony's `Symfony\Component\Console\Command\Command` class.

- #### Handlebars Engine Initialisation
	
	Called when the Handlebars engine is created. Useful for registering custom helpers with the Handlebars engine.

	```php
	Event::listen('handlebars.init', function ($handlebars) {

	});
	```

- #### View Data Loaded
	
	Called whenever a `data.json` file is loaded. Can be used to pass in dynamic data to a pattern that couldn't otherwise be read from a flat `data.json` file.

	```php
	ViewData::composer('elements/forms/input', function ($data) {
	    $data->label = 'boo yah!';
	});
	```

### CLI

There is a CLI as a convenience for creating new patterns. When in the root directory you can do the following:

```bash
php primer pattern:make components/cards/news-card
```
    
This would create a new pattern directory and placeholder `template.hbs` & `data.json` files.