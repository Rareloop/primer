# Primer

Primer is a tool to aid with the design & development of a web site/app. It helps focus the design process into a series of reusable components and patterns instead of thinking just about templates.

Primer is: 

- a prototyping tool
- a useful resource for cataloging all the individual parts that make up yout style guide
- a way to isolate/develop a single part of the overall system
- a centralised place for designers, developers and product owners to refer to

## Installation

To get started, simply run from the Primer folder:

	$ composer install

## Usage

Out of the box, Primer is setup to run from the root of your domain. You can create a virtual host within Apache or to get up and running straight away run the command:

	php primer serve

This will start a standalone server from which you can begin to work in. By default the server starts on port `8080`, if you would like to run from something different you can supply an additional argument:

	php primer serve 8081

## Patterns

Patterns are the building blocks of your system and Primer provides a simple way to view your entire catalog or just a selection. Patterns are located in the `patterns` folder and are broken down into the following types:

- `patterns/elements`: Basic building blocks, e.g. Headers, Form Elements etc
- `patterns/components`: More complex objects that may incorporate many elements

*Typically `elements` are the same/similar from site to site - `components` are more site specific.*

Patterns are then further divided into groups, to allow multiple patterns to be logically grouped. 

**Example:** For an `element` pattern named `input` inside the `forms` group, the path would be:

	[Primer Directory]/patterns/elements/forms/input

### Anatomy of a pattern

Each Pattern has an implicit `id` and `title`. The `id` is the path used to identify it under the patterns folder, e.g. `elements/forms/input`. `id`'s can be used to [show only specific patterns](#showing-only-specific-patterns) instead of the full catalog.

A patterns `title` is built from the name of the folder name for the pattern, e.g. `elements/lists/ordered-list` => `Ordered List`.

Each folder can have the following files:

- `template.hbs` A Handlebars template used to build the pattern's HTML
- `data.json` *Optional* A JSON object that is passed into the Handlebars template
- `README.md` *Optional* A Markdown formatted text file which can be used to give additional description/notes to the pattern

### Same template, different data

It's possible to have variants of patterns listed in the patterns list that share the same template but that have different data. A good use case for this is form items where it would be advantageous to only write the markup for a field once, but where you wish to show examples for different types (e.g. `text`, `email` etc).

To make a special case of a pattern duplicate the name and append a `~` followed by a unique identifier. For example if you have a pattern `elements/forms/input` you could create `elements/forms/input~email` to provide info on email specific rendering. The template from `input` will be used but the data and notes will be taken from the new pattern.

### Including patterns within one another

Any pattern can be included within another by using a custom Handlebars helper, e.g.

	<div class="sub-pattern">
		{{ #inc elements/forms/input }}
	</div>

The `#inc` helper is compatible with the standard `{{> partial}}` [Handlebars syntax](http://handlebarsjs.com/partials.html) except that it will also load default pattern data too. If you want to override the data passed into the included pattern from the parent pattern you can either:

1. Pass in an object to be used as the context for the pattern (defined in `data.json`)

		{{ #inc elements/forms/input childPatternData }}

2. Pass in key value pairs

		{{ #inc elements/forms/input type="email" id="customer-email" }}

Data available in the child pattern is resolved as follows:

- Default pattern data loaded from included patterns `data.json` *(lowest priority)*
- Current pattern context
- Inline data passed in via the `#inc` function *(highest priority)*

## Templates

Templates are just special cases of Patterns and are located in the `patterns/templates` folder. There is no requirement for grouping, or the level of grouping that is possible. To show a particular template you would use the `template` route, e.g.

	/template/home

Would load the template found in `patterns/templates/home`.

## Views

Views are used to render higher level aspects of the pattern library, this is mostly related to the chrome surrounding patterns, groups and sections. One exception is `[Primer Directory]/views/template.hbs`, this is used as the base for all Templates that you create and is where you can add/remove assets to be loaded on each page.

## Custom Views

Each template can use a separate View if required, to change the View just set the `view` variable in the `data.json` file, e.g.

	{
		"view": "custom-view"
	}

Would use the view: `views/custom-view.hbs`.

## Using different template engines

Since `v2.0.0`, Primer supports different template engines beyond just Handlebars. This makes it easier to tailor Primer to your teams template preference and makes it easier to integrate patterns into a back end system/CMS. We currently have 3 engines implemented:

- [Handlebars](https://github.com/Rareloop/primer-template-engine-handlebars) (default)
- [Twig](https://github.com/Rareloop/primer-template-engine-twig)
- [Blade](https://github.com/Rareloop/primer-template-engine-blade)

## Advanced Usage

### Showing only specific patterns

Multiple patterns/groups can be isolated, enabling a custom list of items to be viewed. To do this seperate the list of pattern/group `id`'s with a `:` character.

	/patterns/elements/forms/button:elements/forms/input

### Events

Primer is built around an Event system that makes it easier to extend. To listen to an event you simply need to call:

	Event::listen('eventname', function () {
	    // Do stuff here
	});

`bootstrap/start.php` contains some examples of events but for clarity here is a list:

- #### CLI Initialisation

	Called when the CLI instance is created. This is useful for extending the CLI with custom commands.

		Event::listen('cli.init', function ($cli) {
		    $cli->add(new \App\Commands\Export);
		});

	Commands need to extend Symfony's `Symfony\Component\Console\Command\Command` class.

- #### Handlebars Engine Initialisation
	
	Called when the Handlebars engine is created. Useful for registering custom helpers with the Handlebars engine.

		Event::listen('handlebars.init', function ($handlebars) {

		});

- #### View Data Loaded
	
	Called whenever a `data.json` file is loaded. Provides a way to modify a patterns default data prior to it being merged with other context data. Can be used to pass in dynamic data to a pattern that couldn't otherwise be read from a flat `data.json` file.

		ViewData::composer('elements/forms/input', function ($data) {
		    $data->label = 'boo yah!';
		});

- #### Pattern Loaded
	
	Called whenever a pattern is about to be rendered.  At this point `$data` is the result of merging the patterns default data and other context data

		Pattern::composer('elements/forms/input', function ($data) {
		    $data->label = 'boo yah!';
		});

### CLI

There is a CLI as a convenience for creating new patterns. When in the root directory you can do the following:

    php primer pattern:make components/cards/news-card
    
This would create a new pattern directory and placeholder `template.hbs` & `data.json` files.
