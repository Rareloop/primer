# Primer
[![Latest Stable Version](https://poser.pugx.org/rareloop/primer-core/v/stable)](https://packagist.org/packages/rareloop/primer-core)
![CI](https://travis-ci.org/Rareloop/primer-core.svg?branch=master)
![Coveralls](https://coveralls.io/repos/github/Rareloop/primer-core/badge.svg?branch=master)
![Downloads](https://img.shields.io/packagist/dt/rareloop/primer-core.svg)

Primer is an extensible Design System/Pattern Library written in PHP. By default it utilises Twig for templating and Markdown/YAML for Documentation.

## Installation
To create a new Primer project run the following command:

`composer create-project rareloop/primer my-primer-folder --remove-vcs`

## Usage
The easiest way to get up and running is to use the inbuilt PHP Standalone Server:

`composer server`

And then open the following URL in your browser `http://localhost:8080`.

If you need to specify the port you can pass this as an argument to the command:

`composer server 1234`

## Getting Started

Primer has three separate sections:

1. [Documents](#documents) - A place to store the written documentation for your Design System.
2. [Patterns](#patterns) - A Pattern Library that catalogues all the components within your system.
3. [Templates](#templates) - A way to view the various Page Templates available in your system.

## Patterns

Patterns are the building blocks of your system and Primer provides a simple way to view your entire catalogue, a selection or just a single item. Patterns are located in the `resources/patterns` folder and are themselves a folder that contain all it's related files.

### Anatomy of a pattern

Each Pattern has an implicit `id` and `title`. 

The `id` is the path used to identify it under the patterns folder, e.g. `elements/forms/input`.

A patterns `title` is built from the name of the pattern's folder, e.g. `elements/lists/ordered-list` => `Ordered List`.

Each pattern folder can contain the following:

- **A template** A Twig template used to build the pattern's HTML (`template.twig`)
- **One or more data files** A file to provide the state data required by the template file

### State Data

Out of the box, Primer supports State Data in two formats, PHP or JSON.

#### PHP State Data

PHP State Data files are named `data.php` and must return an array of key/values. This data is then passed to your Twig template at render time.

```php
<?php

return [
    'title' => 'Page Title',
];
```

#### JSON State Data

State Data can also be provided as JSON files which are named `data.json`. This data is then passed to your Twig template at render time.

```json
{
    "title": "Page Title"
}
```

#### Alternative State Data

When building a Pattern Library it is important to be able to easily test the different states a component can be in and Primer makes this easy. Alternative states can be provided by adding additional files to your Pattern folder in the format:

`data~statename.(php|json)`

For example to show the error state for an input component you could create a file called `data~error.php`.

### Including patterns within one another

Any pattern can be included within another by using the standard Twig include and referencing the Pattern with it's `id`, e.g.

```html
{% include 'components/common/site-header' %}
```

## Templates

Templates can be built up using a mix of custom HTML and Pattern includes and are stored in `resources/templates`. If required additional grouping/nesting can be achieved by adding folders.

All templates should extend from `primer-base.twig` and your custom content should be added to the `templateContent` block, e.g.

```
{% extends 'primer-base.twig' %}

{% block templateContent %}
    <h1>Example Template</h1>
    <p>This is an example page template that extends from the <code>primer-base.twig</code> file.</p>
{% endblock %}
```

## Documents

Primer provides a simple way to present your Design System Documentation using MarkDown files.

To add a new Documentation Page, simply add a Markdown file (with the `.md` extension) to `resources/docs` folder. You can create grouping/nesting by including folders in the structure.

### Meta Data

By default Primer will give your Page a title based on the filename but this can be overwritten by adding YAML FrontMatter to your file. For example, to specify the Title and Description you could do the following:

```
---
title: Page Title
description: This is a description
---
# Heading 1

Lorem ipsum dolor sit amet, consectetur adipisicing elit. Hic placeat iusto animi architecto quasi, praesentium.
```

Both `title` & `description` are keywords that Primer knows how to handle but you are free to add any additional meta data to the FrontMatter that you like. All Markdown files are also passed through the Twig Environment, so custom meta can be used to dynamically generate HTML.

```
---
title: Page Title
description: This is a description
colours:
    - ff0000
    - 00ff00
    - 0000ff
---
# Colours

<ul>
{% for colour in colours %}
    <li>{{ colour }}</li>
{% endfor %}
</ul>

These are the colours we use!
```

## Adding Frontend Assets

Primer is un-opinionated about what Frontend stack you choose to use. Once you're ready to add CSS and JavaScript assets to your HTML, you should do this in the `views/primer-base.twig` file. This is a common ancestor that all Primer requests use which will ensure your Patterns and Templates will render as you'd expect.
