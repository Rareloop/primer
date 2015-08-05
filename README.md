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

```
php primer serve
```

This will start a standalone server from which you can begin to work in. By default the server starts on port `8080`, if you would like to run from something different you can supply an additional argument:

```bash
php primer serve 8081
```

## Patterns

Patterns are the building blocks of your system and Primer provides a simple way to view your entire catalog or just a selection. Patterns are located in the `patterns` folder and are broken down into the following types:

- `patterns/elements`: Basic building blocks, e.g. Headers, Form Elements etc
- `patterns/components`: More complex objects that may incorporate many elements

*Typically `elements` are the same/similar from site to site - `components` are more site specific.*

Patterns are then futher divided into groups, to allow multiple patterns to be logically grouped. 

**Example:** For an `element` pattern named `input` inside the `forms` group, the path would be:

```
[Primer Directory]/patterns/elements/forms/input
```

### Anotomy of a pattern

Each Pattern has an implicit `id` and `title`. The `id` is the path used to identify it under the patterns folder, e.g. `elements/forms/input`. `id`'s can be used to [show only specific patterns](#showing-only-specific-patterns) instead of the full catalog.

A patterns `title` is built from the name of the folder name for the pattern, e.g. `elements/lists/ordered-list` => `Ordered List`.

Each folder can have the following files:

- `template.hbs` A Handlebars template used to build the pattern's HTML (also supports .handlebars extension)
- `data.json` *Optional* A JSON object that is passed into the Handlebars template
- `README.md` *Optional* A Markdown formatted text file which can be used to give additional description/notes to the pattern

### Same template, different data

It's possible to have variants of patterns listed in the patterns list that share the same template but that have different data. A good use case for this is form items where it would be advantagous to only write the markup for a field once, but where you wish to show examples for different types (e.g. `text`, `email` etc).

To make a special case of a pattern duplicate the name and append a `~` followed by a unique identifier. For example if you have a pattern `elements/forms/input` you could create `elements/forms/input~email` to provide info on email specific rendering. The template from `input` will be used but the data and notes will be taken from the new pattern.

### Including patterns within one another

Any pattern can be included within another by using a custom Handlebars helper, e.g.

```hbs
<div class="sub-pattern">
	{{#inc elements/forms/input}}
</div>
```

Data from the included pattern will be loaded for it by default. If you want to override the data in the parent pattern you can add it to the parent patterns `data.json` with a key that matches the last part of the included patterns `id` e.g. For the above example we would have something like:

```json
{
	"input": {
		"title": "Sub Pattern Title"
	}
}
```

## Templates

Templates are just special cases of Patterns and are located in the `patterns/templates` folder. There is no requirement for grouping, or the level of grouping that is possible. To show a particular template you would use the `template` route, e.g.

```
/template/home
```

Would load the template found in `patterns/templates/home`.

### Using data aliases	
Sometimes it will be desirable to show the same pattern multiple times within the same template but each time with different data (e.g. Prototyping a form with multiple inputs). To handle this usecase the `#inc` helper can take an optional second parameter which allows for an alias to be used to load different data.

If the template looked like the following:

```hbs
<div class="sub-pattern">
	{{#inc elements/forms/input data="name"}}
	{{#inc elements/forms/input data="email"}}
</div>
```

The template `data.json` would look like this:

```json
{
	"input:name": {
		"title": "What is your name?",
		"type": "text"
	},

	"input:email": {
		"title": "What is your email?",
		"type": "email"
	}
}
```

## Custom Views

Each template can use a seperate View if required, to change the View just set the `view` variable in the `data.json` file, e.g.

```json
{
	"view": "custom-view"
}
```

Would use the view: `views/custom-view.hbs`. The default value for `view` is `template`.

## Advanced Usage

### Showing only specific patterns

Multiple patterns/groups can be isolated, enabling a custom list of items to be viewed. To do this seperate the list of pattern/group `id`'s with a `:` character.

```
/patterns/elements/forms/button:elements/forms/input
```

## CLI

There is a CLI as a convenience for creating new patterns. When in the root directory you can do the following:

```bash
php primer pattern:make components/cards/news-card
```
    
This would create a new pattern directory and placeholder `template.hbs` & `data.json` files.

## License
Primer is ©2015 Rareloop and is licensed under the terms of the [MIT license](http://opensource.org/licenses/MIT)
