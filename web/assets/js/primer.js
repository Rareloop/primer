(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
Prism.languages.json = {
	'property': /"(?:\\.|[^\\"\r\n])*"(?=\s*:)/i,
	'string': {
		pattern: /"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,
		greedy: true
	},
	'number': /\b0x[\dA-Fa-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee][+-]?\d+)?/,
	'punctuation': /[{}[\]);,]/,
	'operator': /:/g,
	'boolean': /\b(?:true|false)\b/i,
	'null': /\bnull\b/i
};

Prism.languages.jsonp = Prism.languages.json;

},{}],2:[function(require,module,exports){
Prism.languages.twig = {
	'comment': /\{#[\s\S]*?#\}/,
	'tag': {
		pattern: /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/,
		inside: {
			'ld': {
				pattern: /^(?:\{\{-?|\{%-?\s*\w+)/,
				inside: {
					'punctuation': /^(?:\{\{|\{%)-?/,
					'keyword': /\w+/
				}
			},
			'rd': {
				pattern: /-?(?:%\}|\}\})$/,
				inside: {
					'punctuation': /.*/
				}
			},
			'string': {
				pattern: /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/,
				inside: {
					'punctuation': /^['"]|['"]$/
				}
			},
			'keyword': /\b(?:even|if|odd)\b/,
			'boolean': /\b(?:true|false|null)\b/,
			'number': /\b0x[\dA-Fa-f]+|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee][-+]?\d+)?/,
			'operator': [
				{
					pattern: /(\s)(?:and|b-and|b-xor|b-or|ends with|in|is|matches|not|or|same as|starts with)(?=\s)/,
					lookbehind: true
				},
				/[=<>]=?|!=|\*\*?|\/\/?|\?:?|[-+~%|]/
			],
			'property': /\b[a-zA-Z_]\w*\b/,
			'punctuation': /[()\[\]{}:.,]/
		}
	},

	// The rest can be parsed as HTML
	'other': {
		// We want non-blank matches
		pattern: /\S(?:[\s\S]*\S)?/,
		inside: Prism.languages.markup
	}
};

},{}],3:[function(require,module,exports){
(function (global){

/* **********************************************
     Begin prism-core.js
********************************************** */

var _self = (typeof window !== 'undefined')
	? window   // if in browser
	: (
		(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
		? self // if in worker
		: {}   // if in node js
	);

/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 * MIT license http://www.opensource.org/licenses/mit-license.php/
 * @author Lea Verou http://lea.verou.me
 */

var Prism = (function(){

// Private helper vars
var lang = /\blang(?:uage)?-([\w-]+)\b/i;
var uniqueId = 0;

var _ = _self.Prism = {
	manual: _self.Prism && _self.Prism.manual,
	disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,
	util: {
		encode: function (tokens) {
			if (tokens instanceof Token) {
				return new Token(tokens.type, _.util.encode(tokens.content), tokens.alias);
			} else if (_.util.type(tokens) === 'Array') {
				return tokens.map(_.util.encode);
			} else {
				return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
			}
		},

		type: function (o) {
			return Object.prototype.toString.call(o).match(/\[object (\w+)\]/)[1];
		},

		objId: function (obj) {
			if (!obj['__id']) {
				Object.defineProperty(obj, '__id', { value: ++uniqueId });
			}
			return obj['__id'];
		},

		// Deep clone a language definition (e.g. to extend it)
		clone: function (o, visited) {
			var type = _.util.type(o);
			visited = visited || {};

			switch (type) {
				case 'Object':
					if (visited[_.util.objId(o)]) {
						return visited[_.util.objId(o)];
					}
					var clone = {};
					visited[_.util.objId(o)] = clone;

					for (var key in o) {
						if (o.hasOwnProperty(key)) {
							clone[key] = _.util.clone(o[key], visited);
						}
					}

					return clone;

				case 'Array':
					if (visited[_.util.objId(o)]) {
						return visited[_.util.objId(o)];
					}
					var clone = [];
					visited[_.util.objId(o)] = clone;

					o.forEach(function (v, i) {
						clone[i] = _.util.clone(v, visited);
					});

					return clone;
			}

			return o;
		}
	},

	languages: {
		extend: function (id, redef) {
			var lang = _.util.clone(_.languages[id]);

			for (var key in redef) {
				lang[key] = redef[key];
			}

			return lang;
		},

		/**
		 * Insert a token before another token in a language literal
		 * As this needs to recreate the object (we cannot actually insert before keys in object literals),
		 * we cannot just provide an object, we need anobject and a key.
		 * @param inside The key (or language id) of the parent
		 * @param before The key to insert before. If not provided, the function appends instead.
		 * @param insert Object with the key/value pairs to insert
		 * @param root The object that contains `inside`. If equal to Prism.languages, it can be omitted.
		 */
		insertBefore: function (inside, before, insert, root) {
			root = root || _.languages;
			var grammar = root[inside];

			if (arguments.length == 2) {
				insert = arguments[1];

				for (var newToken in insert) {
					if (insert.hasOwnProperty(newToken)) {
						grammar[newToken] = insert[newToken];
					}
				}

				return grammar;
			}

			var ret = {};

			for (var token in grammar) {

				if (grammar.hasOwnProperty(token)) {

					if (token == before) {

						for (var newToken in insert) {

							if (insert.hasOwnProperty(newToken)) {
								ret[newToken] = insert[newToken];
							}
						}
					}

					ret[token] = grammar[token];
				}
			}

			// Update references in other language definitions
			_.languages.DFS(_.languages, function(key, value) {
				if (value === root[inside] && key != inside) {
					this[key] = ret;
				}
			});

			return root[inside] = ret;
		},

		// Traverse a language definition with Depth First Search
		DFS: function(o, callback, type, visited) {
			visited = visited || {};
			for (var i in o) {
				if (o.hasOwnProperty(i)) {
					callback.call(o, i, o[i], type || i);

					if (_.util.type(o[i]) === 'Object' && !visited[_.util.objId(o[i])]) {
						visited[_.util.objId(o[i])] = true;
						_.languages.DFS(o[i], callback, null, visited);
					}
					else if (_.util.type(o[i]) === 'Array' && !visited[_.util.objId(o[i])]) {
						visited[_.util.objId(o[i])] = true;
						_.languages.DFS(o[i], callback, i, visited);
					}
				}
			}
		}
	},
	plugins: {},

	highlightAll: function(async, callback) {
		_.highlightAllUnder(document, async, callback);
	},

	highlightAllUnder: function(container, async, callback) {
		var env = {
			callback: callback,
			selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
		};

		_.hooks.run("before-highlightall", env);

		var elements = env.elements || container.querySelectorAll(env.selector);

		for (var i=0, element; element = elements[i++];) {
			_.highlightElement(element, async === true, env.callback);
		}
	},

	highlightElement: function(element, async, callback) {
		// Find language
		var language, grammar, parent = element;

		while (parent && !lang.test(parent.className)) {
			parent = parent.parentNode;
		}

		if (parent) {
			language = (parent.className.match(lang) || [,''])[1].toLowerCase();
			grammar = _.languages[language];
		}

		// Set language on the element, if not present
		element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;

		if (element.parentNode) {
			// Set language on the parent, for styling
			parent = element.parentNode;

			if (/pre/i.test(parent.nodeName)) {
				parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
			}
		}

		var code = element.textContent;

		var env = {
			element: element,
			language: language,
			grammar: grammar,
			code: code
		};

		_.hooks.run('before-sanity-check', env);

		if (!env.code || !env.grammar) {
			if (env.code) {
				_.hooks.run('before-highlight', env);
				env.element.textContent = env.code;
				_.hooks.run('after-highlight', env);
			}
			_.hooks.run('complete', env);
			return;
		}

		_.hooks.run('before-highlight', env);

		if (async && _self.Worker) {
			var worker = new Worker(_.filename);

			worker.onmessage = function(evt) {
				env.highlightedCode = evt.data;

				_.hooks.run('before-insert', env);

				env.element.innerHTML = env.highlightedCode;

				callback && callback.call(env.element);
				_.hooks.run('after-highlight', env);
				_.hooks.run('complete', env);
			};

			worker.postMessage(JSON.stringify({
				language: env.language,
				code: env.code,
				immediateClose: true
			}));
		}
		else {
			env.highlightedCode = _.highlight(env.code, env.grammar, env.language);

			_.hooks.run('before-insert', env);

			env.element.innerHTML = env.highlightedCode;

			callback && callback.call(element);

			_.hooks.run('after-highlight', env);
			_.hooks.run('complete', env);
		}
	},

	highlight: function (text, grammar, language) {
		var env = {
			code: text,
			grammar: grammar,
			language: language
		};
		_.hooks.run('before-tokenize', env);
		env.tokens = _.tokenize(env.code, env.grammar);
		_.hooks.run('after-tokenize', env);
		return Token.stringify(_.util.encode(env.tokens), env.language);
	},

	matchGrammar: function (text, strarr, grammar, index, startPos, oneshot, target) {
		var Token = _.Token;

		for (var token in grammar) {
			if(!grammar.hasOwnProperty(token) || !grammar[token]) {
				continue;
			}

			if (token == target) {
				return;
			}

			var patterns = grammar[token];
			patterns = (_.util.type(patterns) === "Array") ? patterns : [patterns];

			for (var j = 0; j < patterns.length; ++j) {
				var pattern = patterns[j],
					inside = pattern.inside,
					lookbehind = !!pattern.lookbehind,
					greedy = !!pattern.greedy,
					lookbehindLength = 0,
					alias = pattern.alias;

				if (greedy && !pattern.pattern.global) {
					// Without the global flag, lastIndex won't work
					var flags = pattern.pattern.toString().match(/[imuy]*$/)[0];
					pattern.pattern = RegExp(pattern.pattern.source, flags + "g");
				}

				pattern = pattern.pattern || pattern;

				// Don’t cache length as it changes during the loop
				for (var i = index, pos = startPos; i < strarr.length; pos += strarr[i].length, ++i) {

					var str = strarr[i];

					if (strarr.length > text.length) {
						// Something went terribly wrong, ABORT, ABORT!
						return;
					}

					if (str instanceof Token) {
						continue;
					}

					if (greedy && i != strarr.length - 1) {
						pattern.lastIndex = pos;
						var match = pattern.exec(text);
						if (!match) {
							break;
						}

						var from = match.index + (lookbehind ? match[1].length : 0),
						    to = match.index + match[0].length,
						    k = i,
						    p = pos;

						for (var len = strarr.length; k < len && (p < to || (!strarr[k].type && !strarr[k - 1].greedy)); ++k) {
							p += strarr[k].length;
							// Move the index i to the element in strarr that is closest to from
							if (from >= p) {
								++i;
								pos = p;
							}
						}

						// If strarr[i] is a Token, then the match starts inside another Token, which is invalid
						if (strarr[i] instanceof Token) {
							continue;
						}

						// Number of tokens to delete and replace with the new match
						delNum = k - i;
						str = text.slice(pos, p);
						match.index -= pos;
					} else {
						pattern.lastIndex = 0;

						var match = pattern.exec(str),
							delNum = 1;
					}

					if (!match) {
						if (oneshot) {
							break;
						}

						continue;
					}

					if(lookbehind) {
						lookbehindLength = match[1] ? match[1].length : 0;
					}

					var from = match.index + lookbehindLength,
					    match = match[0].slice(lookbehindLength),
					    to = from + match.length,
					    before = str.slice(0, from),
					    after = str.slice(to);

					var args = [i, delNum];

					if (before) {
						++i;
						pos += before.length;
						args.push(before);
					}

					var wrapped = new Token(token, inside? _.tokenize(match, inside) : match, alias, match, greedy);

					args.push(wrapped);

					if (after) {
						args.push(after);
					}

					Array.prototype.splice.apply(strarr, args);

					if (delNum != 1)
						_.matchGrammar(text, strarr, grammar, i, pos, true, token);

					if (oneshot)
						break;
				}
			}
		}
	},

	tokenize: function(text, grammar, language) {
		var strarr = [text];

		var rest = grammar.rest;

		if (rest) {
			for (var token in rest) {
				grammar[token] = rest[token];
			}

			delete grammar.rest;
		}

		_.matchGrammar(text, strarr, grammar, 0, 0, false);

		return strarr;
	},

	hooks: {
		all: {},

		add: function (name, callback) {
			var hooks = _.hooks.all;

			hooks[name] = hooks[name] || [];

			hooks[name].push(callback);
		},

		run: function (name, env) {
			var callbacks = _.hooks.all[name];

			if (!callbacks || !callbacks.length) {
				return;
			}

			for (var i=0, callback; callback = callbacks[i++];) {
				callback(env);
			}
		}
	}
};

var Token = _.Token = function(type, content, alias, matchedStr, greedy) {
	this.type = type;
	this.content = content;
	this.alias = alias;
	// Copy of the full string this token was created from
	this.length = (matchedStr || "").length|0;
	this.greedy = !!greedy;
};

Token.stringify = function(o, language, parent) {
	if (typeof o == 'string') {
		return o;
	}

	if (_.util.type(o) === 'Array') {
		return o.map(function(element) {
			return Token.stringify(element, language, o);
		}).join('');
	}

	var env = {
		type: o.type,
		content: Token.stringify(o.content, language, parent),
		tag: 'span',
		classes: ['token', o.type],
		attributes: {},
		language: language,
		parent: parent
	};

	if (o.alias) {
		var aliases = _.util.type(o.alias) === 'Array' ? o.alias : [o.alias];
		Array.prototype.push.apply(env.classes, aliases);
	}

	_.hooks.run('wrap', env);

	var attributes = Object.keys(env.attributes).map(function(name) {
		return name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
	}).join(' ');

	return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + (attributes ? ' ' + attributes : '') + '>' + env.content + '</' + env.tag + '>';

};

if (!_self.document) {
	if (!_self.addEventListener) {
		// in Node.js
		return _self.Prism;
	}

	if (!_.disableWorkerMessageHandler) {
		// In worker
		_self.addEventListener('message', function (evt) {
			var message = JSON.parse(evt.data),
				lang = message.language,
				code = message.code,
				immediateClose = message.immediateClose;

			_self.postMessage(_.highlight(code, _.languages[lang], lang));
			if (immediateClose) {
				_self.close();
			}
		}, false);
	}

	return _self.Prism;
}

//Get current script and highlight
var script = document.currentScript || [].slice.call(document.getElementsByTagName("script")).pop();

if (script) {
	_.filename = script.src;

	if (!_.manual && !script.hasAttribute('data-manual')) {
		if(document.readyState !== "loading") {
			if (window.requestAnimationFrame) {
				window.requestAnimationFrame(_.highlightAll);
			} else {
				window.setTimeout(_.highlightAll, 16);
			}
		}
		else {
			document.addEventListener('DOMContentLoaded', _.highlightAll);
		}
	}
}

return _self.Prism;

})();

if (typeof module !== 'undefined' && module.exports) {
	module.exports = Prism;
}

// hack for components to work correctly in node.js
if (typeof global !== 'undefined') {
	global.Prism = Prism;
}


/* **********************************************
     Begin prism-markup.js
********************************************** */

Prism.languages.markup = {
	'comment': /<!--[\s\S]*?-->/,
	'prolog': /<\?[\s\S]+?\?>/,
	'doctype': /<!DOCTYPE[\s\S]+?>/i,
	'cdata': /<!\[CDATA\[[\s\S]*?]]>/i,
	'tag': {
		pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+))?)*\s*\/?>/i,
		greedy: true,
		inside: {
			'tag': {
				pattern: /^<\/?[^\s>\/]+/i,
				inside: {
					'punctuation': /^<\/?/,
					'namespace': /^[^\s>\/:]+:/
				}
			},
			'attr-value': {
				pattern: /=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+)/i,
				inside: {
					'punctuation': [
						/^=/,
						{
							pattern: /(^|[^\\])["']/,
							lookbehind: true
						}
					]
				}
			},
			'punctuation': /\/?>/,
			'attr-name': {
				pattern: /[^\s>\/]+/,
				inside: {
					'namespace': /^[^\s>\/:]+:/
				}
			}

		}
	},
	'entity': /&#?[\da-z]{1,8};/i
};

Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] =
	Prism.languages.markup['entity'];

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', function(env) {

	if (env.type === 'entity') {
		env.attributes['title'] = env.content.replace(/&amp;/, '&');
	}
});

Prism.languages.xml = Prism.languages.markup;
Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;


/* **********************************************
     Begin prism-css.js
********************************************** */

Prism.languages.css = {
	'comment': /\/\*[\s\S]*?\*\//,
	'atrule': {
		pattern: /@[\w-]+?.*?(?:;|(?=\s*\{))/i,
		inside: {
			'rule': /@[\w-]+/
			// See rest below
		}
	},
	'url': /url\((?:(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,
	'selector': /[^{}\s][^{};]*?(?=\s*\{)/,
	'string': {
		pattern: /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'property': /[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,
	'important': /\B!important\b/i,
	'function': /[-a-z0-9]+(?=\()/i,
	'punctuation': /[(){};:]/
};

Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'style': {
			pattern: /(<style[\s\S]*?>)[\s\S]*?(?=<\/style>)/i,
			lookbehind: true,
			inside: Prism.languages.css,
			alias: 'language-css',
			greedy: true
		}
	});

	Prism.languages.insertBefore('inside', 'attr-value', {
		'style-attr': {
			pattern: /\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,
			inside: {
				'attr-name': {
					pattern: /^\s*style/i,
					inside: Prism.languages.markup.tag.inside
				},
				'punctuation': /^\s*=\s*['"]|['"]\s*$/,
				'attr-value': {
					pattern: /.+/i,
					inside: Prism.languages.css
				}
			},
			alias: 'language-css'
		}
	}, Prism.languages.markup.tag);
}

/* **********************************************
     Begin prism-clike.js
********************************************** */

Prism.languages.clike = {
	'comment': [
		{
			pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
			lookbehind: true
		},
		{
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: true,
			greedy: true
		}
	],
	'string': {
		pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'class-name': {
		pattern: /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[\w.\\]+/i,
		lookbehind: true,
		inside: {
			punctuation: /[.\\]/
		}
	},
	'keyword': /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
	'boolean': /\b(?:true|false)\b/,
	'function': /[a-z0-9_]+(?=\()/i,
	'number': /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
	'operator': /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
	'punctuation': /[{}[\];(),.:]/
};


/* **********************************************
     Begin prism-javascript.js
********************************************** */

Prism.languages.javascript = Prism.languages.extend('clike', {
	'keyword': /\b(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/,
	'number': /\b(?:0[xX][\dA-Fa-f]+|0[bB][01]+|0[oO][0-7]+|NaN|Infinity)\b|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee][+-]?\d+)?/,
	// Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
	'function': /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*\()/i,
	'operator': /-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/
});

Prism.languages.insertBefore('javascript', 'keyword', {
	'regex': {
		pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(\[[^\]\r\n]+]|\\.|[^/\\\[\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})\]]))/,
		lookbehind: true,
		greedy: true
	},
	// This must be declared before keyword because we use "function" inside the look-forward
	'function-variable': {
		pattern: /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=\s*(?:function\b|(?:\([^()]*\)|[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/i,
		alias: 'function'
	},
	'constant': /\b[A-Z][A-Z\d_]*\b/
});

Prism.languages.insertBefore('javascript', 'string', {
	'template-string': {
		pattern: /`(?:\\[\s\S]|\${[^}]+}|[^\\`])*`/,
		greedy: true,
		inside: {
			'interpolation': {
				pattern: /\${[^}]+}/,
				inside: {
					'interpolation-punctuation': {
						pattern: /^\${|}$/,
						alias: 'punctuation'
					},
					rest: null // See below
				}
			},
			'string': /[\s\S]+/
		}
	}
});
Prism.languages.javascript['template-string'].inside['interpolation'].inside.rest = Prism.languages.javascript;

if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'script': {
			pattern: /(<script[\s\S]*?>)[\s\S]*?(?=<\/script>)/i,
			lookbehind: true,
			inside: Prism.languages.javascript,
			alias: 'language-javascript',
			greedy: true
		}
	});
}

Prism.languages.js = Prism.languages.javascript;


/* **********************************************
     Begin prism-file-highlight.js
********************************************** */

(function () {
	if (typeof self === 'undefined' || !self.Prism || !self.document || !document.querySelector) {
		return;
	}

	self.Prism.fileHighlight = function() {

		var Extensions = {
			'js': 'javascript',
			'py': 'python',
			'rb': 'ruby',
			'ps1': 'powershell',
			'psm1': 'powershell',
			'sh': 'bash',
			'bat': 'batch',
			'h': 'c',
			'tex': 'latex'
		};

		Array.prototype.slice.call(document.querySelectorAll('pre[data-src]')).forEach(function (pre) {
			var src = pre.getAttribute('data-src');

			var language, parent = pre;
			var lang = /\blang(?:uage)?-([\w-]+)\b/i;
			while (parent && !lang.test(parent.className)) {
				parent = parent.parentNode;
			}

			if (parent) {
				language = (pre.className.match(lang) || [, ''])[1];
			}

			if (!language) {
				var extension = (src.match(/\.(\w+)$/) || [, ''])[1];
				language = Extensions[extension] || extension;
			}

			var code = document.createElement('code');
			code.className = 'language-' + language;

			pre.textContent = '';

			code.textContent = 'Loading…';

			pre.appendChild(code);

			var xhr = new XMLHttpRequest();

			xhr.open('GET', src, true);

			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4) {

					if (xhr.status < 400 && xhr.responseText) {
						code.textContent = xhr.responseText;

						Prism.highlightElement(code);
					}
					else if (xhr.status >= 400) {
						code.textContent = '✖ Error ' + xhr.status + ' while fetching file: ' + xhr.statusText;
					}
					else {
						code.textContent = '✖ Error: File does not exist or is empty';
					}
				}
			};

			xhr.send(null);
		});

		if (Prism.plugins.toolbar) {
			Prism.plugins.toolbar.registerButton('download-file', function (env) {
				var pre = env.element.parentNode;
				if (!pre || !/pre/i.test(pre.nodeName) || !pre.hasAttribute('data-src') || !pre.hasAttribute('data-download-link')) {
					return;
				}
				var src = pre.getAttribute('data-src');
				var a = document.createElement('a');
				a.textContent = pre.getAttribute('data-download-link-label') || 'Download';
				a.setAttribute('download', '');
				a.href = src;
				return a;
			});
		}

	};

	document.addEventListener('DOMContentLoaded', self.Prism.fileHighlight);

})();
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],4:[function(require,module,exports){
'use strict';

require('prismjs/prism.js');

require('prismjs/components/prism-twig');

require('prismjs/components/prism-json');

// Setup each Pattern
var patterns = document.querySelectorAll('.primer-pattern');

patterns.forEach(function (pattern) {
    pattern.classList.add('primer-pattern--enhanced');

    var codeBlocks = pattern.querySelectorAll('.primer-tab__code');

    codeBlocks.forEach(function (codeBlock) {
        Prism.highlightElement(codeBlock);
    });
});

// Setup each set of Tabs
var tabs = document.querySelectorAll('.primer-tabs');

tabs.forEach(function (tabs) {
    var links = tabs.querySelectorAll('.primer-tabs-toc__link');
    var panels = tabs.querySelectorAll('.primer-tab');

    links.forEach(function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault();

            var id = link.getAttribute('href').replace('#', '');

            panels.forEach(function (panel) {
                if (panel.id === id) {
                    panel.removeAttribute('hidden');
                } else {
                    panel.setAttribute('hidden', true);
                }
            });

            links.forEach(function (l) {
                l.setAttribute('aria-selected', false);
            });

            link.setAttribute('aria-selected', true);
        });
    });

    links[0].dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    }));
});

// Setup all State options
var stateControls = document.querySelectorAll('.primer-pattern__states');

stateControls.forEach(function (stateControl) {
    var select = document.createElement('select');
    select.classList.add('primer-pattern__states-select');

    stateControl.querySelectorAll('.primer-pattern__state-link').forEach(function (state) {
        var option = document.createElement('option');
        option.innerText = state.innerText;
        option.setAttribute('data-url', state.getAttribute('href'));

        select.appendChild(option);

        if (state.classList.contains('primer-pattern__state-link--current')) {
            select.selectedIndex = select.options.length - 1;
        }
    });

    var div = document.createElement('div');
    div.classList.add('primer-pattern__states-select-container');
    div.appendChild(select);

    stateControl.replaceWith(div);

    select.addEventListener('change', function (event) {
        var selectedOption = event.target.options[event.target.selectedIndex];
        var url = selectedOption.dataset.url;

        window.location = url;
    });
});

},{"prismjs/components/prism-json":1,"prismjs/components/prism-twig":2,"prismjs/prism.js":3}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _el = require('../utilities/el');

var _el2 = _interopRequireDefault(_el);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var keys = {
    ESC: 27,
    UP: 38,
    DOWN: 40,
    ENTER: 13
};

var _class = function () {
    function _class(container, nav) {
        _classCallCheck(this, _class);

        this.container = container;
        this.nav = nav;
        this.items = this.getSearchData();
        this.currentIndex = -1;

        var id = 'search-' + Date.now();

        this.surface = (0, _el2.default)('\n            <div class="primer-search">\n                <div class="primer-search__control">\n                    <label for="' + id + '" class="primer-search__label">Search</label>\n                    <input id="' + id + '" type="text" class="primer-search__input" />\n                </div>\n                <ul class="primer-search__results"></ul>\n            </div>\n        ');

        this.resultsUl = this.surface.querySelector('.primer-search__results');

        this.container.appendChild(this.surface);

        this.setupEventListeners();
    }

    _createClass(_class, [{
        key: 'setupEventListeners',
        value: function setupEventListeners() {
            var _this = this;

            this.addEventListener('keyup', '.primer-search__input', function (event) {
                if (event.keyCode === keys.ESC) {
                    event.target.value = '';
                }

                if (event.keyCode === keys.DOWN) {
                    _this.setCurrentIndex(_this.currentIndex + 1);
                    return;
                }

                if (event.keyCode === keys.UP) {
                    _this.setCurrentIndex(_this.currentIndex - 1);
                    return;
                }

                if (event.keyCode === keys.ENTER) {
                    _this.selectIndex(_this.currentIndex);
                    return;
                }

                _this.updateResults(event.target.value);
            });

            this.addEventListener('focus', '.primer-search__input', function (event) {

                _this.surface.classList.add('primer-search--focus');
                _this.updateResults(event.target.value);
            });

            this.addEventListener('blur', '.primer-search__input', function (event) {
                _this.renderResults([]);

                _this.surface.classList.remove('primer-search--focus');
                _this.disableSearching();
                _this.container.querySelector('.primer-search__input').value = '';
            });
        }
    }, {
        key: 'selectIndex',
        value: function selectIndex(index) {
            var results = this.surface.querySelectorAll('.primer-search__result');

            if (index < results.length) {
                window.location = results[index].querySelector('.primer-search__result-link').getAttribute('href');
            }
        }
    }, {
        key: 'setCurrentIndex',
        value: function setCurrentIndex(index) {
            var results = this.surface.querySelectorAll('.primer-search__result');

            if (index < 0 || index >= results.length || index === undefined) {
                return;
            }

            if (results[this.currentIndex]) {
                results[this.currentIndex].classList.remove('primer-search__result--current');
            }

            results[index].classList.add('primer-search__result--current');

            this.currentIndex = index;
        }
    }, {
        key: 'enableSearching',
        value: function enableSearching() {
            this.surface.closest('.primer-sidebar').classList.add('primer-sidebar--searching');

            this.currentIndex = -1;
        }
    }, {
        key: 'disableSearching',
        value: function disableSearching() {
            this.surface.closest('.primer-sidebar').classList.remove('primer-sidebar--searching');
        }
    }, {
        key: 'updateResults',
        value: function updateResults(query) {
            if (query === '') {
                this.disableSearching();
            } else {
                this.enableSearching();
            }

            var results = this.getFilteredData(query);

            if (results.length || query.length === 0) {
                this.renderResults(results);
            } else {
                this.renderNoResults();
            }
        }
    }, {
        key: 'getSearchData',
        value: function getSearchData() {
            var allItems = [];

            this.nav.querySelectorAll('.primer-nav-item--leaf-node').forEach(function (item) {
                var link = item.querySelector('.primer-nav-item__link').getAttribute('href');
                var title = item.querySelector('.primer-nav-item__link-title').innerText;

                var data = {
                    id: item.dataset.id,
                    path: item.dataset.id.split('/'),
                    title: title,
                    link: link
                };

                allItems.push(data);
            });

            return allItems.sort(function (a, b) {
                return a.title.localeCompare(b.title);
            });
        }
    }, {
        key: 'getFilteredData',
        value: function getFilteredData(query) {
            if (query === '') {
                return [];
            }

            return this.items.filter(function (item) {
                return item.id.includes(query.toLowerCase());
            });
        }
    }, {
        key: 'renderResults',
        value: function renderResults(results) {
            var fragment = document.createDocumentFragment();

            results.forEach(function (result) {
                var li = (0, _el2.default)('\n                <li class="primer-search__result">\n                    <a href="' + result.link + '" class="primer-search__result-link">\n                        <span class="primer-search__result-title">' + result.title + '</span>\n                        <span class="primer-search__result-id">' + result.id + '</span>\n                    </a>\n                </li>\n            ');

                fragment.appendChild(li);
            });

            this.resultsUl.innerHTML = '';
            this.resultsUl.appendChild(fragment);
        }
    }, {
        key: 'renderNoResults',
        value: function renderNoResults() {
            var li = (0, _el2.default)('\n            <li class="primer-search__result primer-search__result--empty">\n                <span class="primer-search__result-title">No matches</span>\n            </li>\n        ');

            this.resultsUl.innerHTML = '';
            this.resultsUl.appendChild(li);
        }
    }, {
        key: 'addEventListener',
        value: function addEventListener(eventName, selector, callback) {
            // https://www.quirksmode.org/blog/archives/2008/04/delegating_the.html
            var captureEvents = ['focus', 'blur', 'change'];

            var capture = captureEvents.indexOf(eventName) !== -1;

            this.surface.addEventListener(eventName, function (event) {
                if (event.target.matches(selector)) {
                    callback(event);
                }
            }, capture);
        }
    }]);

    return _class;
}();

exports.default = _class;
;

},{"../utilities/el":9}],6:[function(require,module,exports){
'use strict';

var _search = require('./search');

var _search2 = _interopRequireDefault(_search);

var _sidebar = require('./sidebar.small');

var _sidebar2 = _interopRequireDefault(_sidebar);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var sidebar = document.querySelector('.primer-sidebar');
sidebar.classList.add('primer-sidebar--enhanced');

// Handle top level sections
var sections = document.querySelectorAll('.primer-sidebar-group');

[].forEach.call(sections, function (section) {
    section.querySelector('.primer-sidebar-group__title').addEventListener('click', function (event) {
        event.preventDefault();

        section.classList.toggle('primer-sidebar-group--open');
    });
});

// Handle Tree
var groupNodeTitles = document.querySelectorAll('.primer-nav-item--has-children > .primer-nav-item__link');

[].forEach.call(groupNodeTitles, function (node) {
    node.addEventListener('click', function (event) {
        if (event.target.nodeName === 'A') {
            return;
        }

        event.preventDefault();

        var groupNode = node.closest('.primer-nav-item');

        groupNode.classList.toggle('primer-nav-item--open');

        if (groupNode.classList.contains('primer-nav-item--open')) {
            groupNode.classList.remove('primer-nav-item--closed');
        } else {
            groupNode.classList.add('primer-nav-item--closed');
        }
    });
});

new _search2.default(document.querySelector('.primer-search-container'), document.querySelector('.primer-sidebar__nav'));
new _sidebar2.default(document.querySelector('.primer-sidebar'));

},{"./search":5,"./sidebar.small":7}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _el = require('../utilities/el');

var _el2 = _interopRequireDefault(_el);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
    function _class(surface) {
        var _this = this;

        _classCallCheck(this, _class);

        if (!('matchMedia' in window)) {
            return;
        }

        this.surface = surface;

        this.mediaQuery = window.matchMedia('(max-width: 1000px)');

        this.mediaQuery.addListener(function (event) {
            if (event.matches) {
                _this.bootstrap();
            } else {
                _this.teardown();
            }
        });

        if (this.mediaQuery.matches) {
            this.bootstrap();
        }
    }

    _createClass(_class, [{
        key: 'bootstrap',
        value: function bootstrap() {
            var _this2 = this;

            this.burger = (0, _el2.default)('\n            <button class="primer-burger" type="button">\n                <span class="primer-burger__text">Show Menu</span>\n            </button>\n        ');

            this.burger.addEventListener('click', function () {
                _this2.toggleMenu();
            });

            this.nav = document.querySelector('.primer-sidebar__nav');

            this.nav.parentNode.insertBefore(this.burger, this.nav);

            this.nav.hidden = true;

            this.surface.classList.add('primer-sidebar--small');
        }
    }, {
        key: 'teardown',
        value: function teardown() {
            this.surface.classList.remove('primer-sidebar--small');

            if (this.burger) {
                this.burger.parentNode.removeChild(this.burger);
                this.burger = null;
            }

            if (this.nav) {
                this.nav.hidden = false;
            }
        }
    }, {
        key: 'toggleMenu',
        value: function toggleMenu() {
            if (this.burger.classList.contains('primer-burger--open')) {
                this.burger.classList.remove('primer-burger--open');
                this.burger.classList.add('primer-burger--closed');
                this.burger.children[0].innerText = 'Show Menu';
                this.nav.hidden = true;
            } else {
                this.burger.classList.add('primer-burger--open');
                this.burger.classList.remove('primer-burger--closed');
                this.burger.children[0].innerText = 'Hide Menu';
                this.nav.hidden = false;
            }
        }
    }]);

    return _class;
}();

exports.default = _class;

},{"../utilities/el":9}],8:[function(require,module,exports){
'use strict';

require('./utilities/polyfills');

require('./partials/sidebar');

require('./partials/sidebar.small');

require('./partials/pattern');

},{"./partials/pattern":4,"./partials/sidebar":6,"./partials/sidebar.small":7,"./utilities/polyfills":10}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return div.children[0];
};

},{}],10:[function(require,module,exports){
'use strict';

// https://developer.mozilla.org/en-US/docs/Web/API/NodeList/forEach#Polyfill
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
if (!String.prototype.includes) {
    Object.defineProperty(String.prototype, 'includes', {
        value: function value(search, start) {
            if (typeof start !== 'number') {
                start = 0;
            }

            if (start + search.length > this.length) {
                return false;
            } else {
                return this.indexOf(search, start) !== -1;
            }
        }
    });
}

// https://developer.mozilla.org/en-US/docs/Web/API/Element/matches
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

// https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
if (!Element.prototype.closest) {
    Element.prototype.closest = function (s) {
        var el = this;

        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

},{}]},{},[8])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcHJpc21qcy9jb21wb25lbnRzL3ByaXNtLWpzb24uanMiLCJub2RlX21vZHVsZXMvcHJpc21qcy9jb21wb25lbnRzL3ByaXNtLXR3aWcuanMiLCJub2RlX21vZHVsZXMvcHJpc21qcy9wcmlzbS5qcyIsInNyYy9qcy9wYXJ0aWFscy9wYXR0ZXJuLmpzIiwic3JjL2pzL3BhcnRpYWxzL3NlYXJjaC5qcyIsInNyYy9qcy9wYXJ0aWFscy9zaWRlYmFyLmpzIiwic3JjL2pzL3BhcnRpYWxzL3NpZGViYXIuc21hbGwuanMiLCJzcmMvanMvcHJpbWVyLmpzIiwic3JjL2pzL3V0aWxpdGllcy9lbC5qcyIsInNyYy9qcy91dGlsaXRpZXMvcG9seWZpbGxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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LENBQVgsQ0FBSixFQUFtQixPQUFPLEVBQVA7QUFDbkIsaUJBQUssR0FBRyxhQUFILElBQW9CLEdBQUcsVUFBNUI7QUFDSCxTQUhELFFBR1MsT0FBTyxJQUFQLElBQWUsR0FBRyxRQUFILEtBQWdCLENBSHhDO0FBSUEsZUFBTyxJQUFQO0FBQ0gsS0FSRDtBQVNIIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiUHJpc20ubGFuZ3VhZ2VzLmpzb24gPSB7XG5cdCdwcm9wZXJ0eSc6IC9cIig/OlxcXFwufFteXFxcXFwiXFxyXFxuXSkqXCIoPz1cXHMqOikvaSxcblx0J3N0cmluZyc6IHtcblx0XHRwYXR0ZXJuOiAvXCIoPzpcXFxcLnxbXlxcXFxcIlxcclxcbl0pKlwiKD8hXFxzKjopLyxcblx0XHRncmVlZHk6IHRydWVcblx0fSxcblx0J251bWJlcic6IC9cXGIweFtcXGRBLUZhLWZdK1xcYnwoPzpcXGJcXGQrXFwuP1xcZCp8XFxCXFwuXFxkKykoPzpbRWVdWystXT9cXGQrKT8vLFxuXHQncHVuY3R1YXRpb24nOiAvW3t9W1xcXSk7LF0vLFxuXHQnb3BlcmF0b3InOiAvOi9nLFxuXHQnYm9vbGVhbic6IC9cXGIoPzp0cnVlfGZhbHNlKVxcYi9pLFxuXHQnbnVsbCc6IC9cXGJudWxsXFxiL2lcbn07XG5cblByaXNtLmxhbmd1YWdlcy5qc29ucCA9IFByaXNtLmxhbmd1YWdlcy5qc29uO1xuIiwiUHJpc20ubGFuZ3VhZ2VzLnR3aWcgPSB7XG5cdCdjb21tZW50JzogL1xceyNbXFxzXFxTXSo/I1xcfS8sXG5cdCd0YWcnOiB7XG5cdFx0cGF0dGVybjogL1xce1xce1tcXHNcXFNdKj9cXH1cXH18XFx7JVtcXHNcXFNdKj8lXFx9Lyxcblx0XHRpbnNpZGU6IHtcblx0XHRcdCdsZCc6IHtcblx0XHRcdFx0cGF0dGVybjogL14oPzpcXHtcXHstP3xcXHslLT9cXHMqXFx3KykvLFxuXHRcdFx0XHRpbnNpZGU6IHtcblx0XHRcdFx0XHQncHVuY3R1YXRpb24nOiAvXig/Olxce1xce3xcXHslKS0/Lyxcblx0XHRcdFx0XHQna2V5d29yZCc6IC9cXHcrL1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0J3JkJzoge1xuXHRcdFx0XHRwYXR0ZXJuOiAvLT8oPzolXFx9fFxcfVxcfSkkLyxcblx0XHRcdFx0aW5zaWRlOiB7XG5cdFx0XHRcdFx0J3B1bmN0dWF0aW9uJzogLy4qL1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0J3N0cmluZyc6IHtcblx0XHRcdFx0cGF0dGVybjogLyhcInwnKSg/OlxcXFwufCg/IVxcMSlbXlxcXFxcXHJcXG5dKSpcXDEvLFxuXHRcdFx0XHRpbnNpZGU6IHtcblx0XHRcdFx0XHQncHVuY3R1YXRpb24nOiAvXlsnXCJdfFsnXCJdJC9cblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdCdrZXl3b3JkJzogL1xcYig/OmV2ZW58aWZ8b2RkKVxcYi8sXG5cdFx0XHQnYm9vbGVhbic6IC9cXGIoPzp0cnVlfGZhbHNlfG51bGwpXFxiLyxcblx0XHRcdCdudW1iZXInOiAvXFxiMHhbXFxkQS1GYS1mXSt8KD86XFxiXFxkK1xcLj9cXGQqfFxcQlxcLlxcZCspKD86W0VlXVstK10/XFxkKyk/Lyxcblx0XHRcdCdvcGVyYXRvcic6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHBhdHRlcm46IC8oXFxzKSg/OmFuZHxiLWFuZHxiLXhvcnxiLW9yfGVuZHMgd2l0aHxpbnxpc3xtYXRjaGVzfG5vdHxvcnxzYW1lIGFzfHN0YXJ0cyB3aXRoKSg/PVxccykvLFxuXHRcdFx0XHRcdGxvb2tiZWhpbmQ6IHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0L1s9PD5dPT98IT18XFwqXFwqP3xcXC9cXC8/fFxcPzo/fFstK34lfF0vXG5cdFx0XHRdLFxuXHRcdFx0J3Byb3BlcnR5JzogL1xcYlthLXpBLVpfXVxcdypcXGIvLFxuXHRcdFx0J3B1bmN0dWF0aW9uJzogL1soKVxcW1xcXXt9Oi4sXS9cblx0XHR9XG5cdH0sXG5cblx0Ly8gVGhlIHJlc3QgY2FuIGJlIHBhcnNlZCBhcyBIVE1MXG5cdCdvdGhlcic6IHtcblx0XHQvLyBXZSB3YW50IG5vbi1ibGFuayBtYXRjaGVzXG5cdFx0cGF0dGVybjogL1xcUyg/OltcXHNcXFNdKlxcUyk/Lyxcblx0XHRpbnNpZGU6IFByaXNtLmxhbmd1YWdlcy5tYXJrdXBcblx0fVxufTtcbiIsIlxuLyogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICBCZWdpbiBwcmlzbS1jb3JlLmpzXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXG5cbnZhciBfc2VsZiA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJylcblx0PyB3aW5kb3cgICAvLyBpZiBpbiBicm93c2VyXG5cdDogKFxuXHRcdCh0eXBlb2YgV29ya2VyR2xvYmFsU2NvcGUgIT09ICd1bmRlZmluZWQnICYmIHNlbGYgaW5zdGFuY2VvZiBXb3JrZXJHbG9iYWxTY29wZSlcblx0XHQ/IHNlbGYgLy8gaWYgaW4gd29ya2VyXG5cdFx0OiB7fSAgIC8vIGlmIGluIG5vZGUganNcblx0KTtcblxuLyoqXG4gKiBQcmlzbTogTGlnaHR3ZWlnaHQsIHJvYnVzdCwgZWxlZ2FudCBzeW50YXggaGlnaGxpZ2h0aW5nXG4gKiBNSVQgbGljZW5zZSBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocC9cbiAqIEBhdXRob3IgTGVhIFZlcm91IGh0dHA6Ly9sZWEudmVyb3UubWVcbiAqL1xuXG52YXIgUHJpc20gPSAoZnVuY3Rpb24oKXtcblxuLy8gUHJpdmF0ZSBoZWxwZXIgdmFyc1xudmFyIGxhbmcgPSAvXFxibGFuZyg/OnVhZ2UpPy0oW1xcdy1dKylcXGIvaTtcbnZhciB1bmlxdWVJZCA9IDA7XG5cbnZhciBfID0gX3NlbGYuUHJpc20gPSB7XG5cdG1hbnVhbDogX3NlbGYuUHJpc20gJiYgX3NlbGYuUHJpc20ubWFudWFsLFxuXHRkaXNhYmxlV29ya2VyTWVzc2FnZUhhbmRsZXI6IF9zZWxmLlByaXNtICYmIF9zZWxmLlByaXNtLmRpc2FibGVXb3JrZXJNZXNzYWdlSGFuZGxlcixcblx0dXRpbDoge1xuXHRcdGVuY29kZTogZnVuY3Rpb24gKHRva2Vucykge1xuXHRcdFx0aWYgKHRva2VucyBpbnN0YW5jZW9mIFRva2VuKSB7XG5cdFx0XHRcdHJldHVybiBuZXcgVG9rZW4odG9rZW5zLnR5cGUsIF8udXRpbC5lbmNvZGUodG9rZW5zLmNvbnRlbnQpLCB0b2tlbnMuYWxpYXMpO1xuXHRcdFx0fSBlbHNlIGlmIChfLnV0aWwudHlwZSh0b2tlbnMpID09PSAnQXJyYXknKSB7XG5cdFx0XHRcdHJldHVybiB0b2tlbnMubWFwKF8udXRpbC5lbmNvZGUpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIHRva2Vucy5yZXBsYWNlKC8mL2csICcmYW1wOycpLnJlcGxhY2UoLzwvZywgJyZsdDsnKS5yZXBsYWNlKC9cXHUwMGEwL2csICcgJyk7XG5cdFx0XHR9XG5cdFx0fSxcblxuXHRcdHR5cGU6IGZ1bmN0aW9uIChvKSB7XG5cdFx0XHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pLm1hdGNoKC9cXFtvYmplY3QgKFxcdyspXFxdLylbMV07XG5cdFx0fSxcblxuXHRcdG9iaklkOiBmdW5jdGlvbiAob2JqKSB7XG5cdFx0XHRpZiAoIW9ialsnX19pZCddKSB7XG5cdFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosICdfX2lkJywgeyB2YWx1ZTogKyt1bmlxdWVJZCB9KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBvYmpbJ19faWQnXTtcblx0XHR9LFxuXG5cdFx0Ly8gRGVlcCBjbG9uZSBhIGxhbmd1YWdlIGRlZmluaXRpb24gKGUuZy4gdG8gZXh0ZW5kIGl0KVxuXHRcdGNsb25lOiBmdW5jdGlvbiAobywgdmlzaXRlZCkge1xuXHRcdFx0dmFyIHR5cGUgPSBfLnV0aWwudHlwZShvKTtcblx0XHRcdHZpc2l0ZWQgPSB2aXNpdGVkIHx8IHt9O1xuXG5cdFx0XHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRcdFx0Y2FzZSAnT2JqZWN0Jzpcblx0XHRcdFx0XHRpZiAodmlzaXRlZFtfLnV0aWwub2JqSWQobyldKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdmlzaXRlZFtfLnV0aWwub2JqSWQobyldO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR2YXIgY2xvbmUgPSB7fTtcblx0XHRcdFx0XHR2aXNpdGVkW18udXRpbC5vYmpJZChvKV0gPSBjbG9uZTtcblxuXHRcdFx0XHRcdGZvciAodmFyIGtleSBpbiBvKSB7XG5cdFx0XHRcdFx0XHRpZiAoby5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdFx0XHRcdGNsb25lW2tleV0gPSBfLnV0aWwuY2xvbmUob1trZXldLCB2aXNpdGVkKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gY2xvbmU7XG5cblx0XHRcdFx0Y2FzZSAnQXJyYXknOlxuXHRcdFx0XHRcdGlmICh2aXNpdGVkW18udXRpbC5vYmpJZChvKV0pIHtcblx0XHRcdFx0XHRcdHJldHVybiB2aXNpdGVkW18udXRpbC5vYmpJZChvKV07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHZhciBjbG9uZSA9IFtdO1xuXHRcdFx0XHRcdHZpc2l0ZWRbXy51dGlsLm9iaklkKG8pXSA9IGNsb25lO1xuXG5cdFx0XHRcdFx0by5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7XG5cdFx0XHRcdFx0XHRjbG9uZVtpXSA9IF8udXRpbC5jbG9uZSh2LCB2aXNpdGVkKTtcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdHJldHVybiBjbG9uZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG87XG5cdFx0fVxuXHR9LFxuXG5cdGxhbmd1YWdlczoge1xuXHRcdGV4dGVuZDogZnVuY3Rpb24gKGlkLCByZWRlZikge1xuXHRcdFx0dmFyIGxhbmcgPSBfLnV0aWwuY2xvbmUoXy5sYW5ndWFnZXNbaWRdKTtcblxuXHRcdFx0Zm9yICh2YXIga2V5IGluIHJlZGVmKSB7XG5cdFx0XHRcdGxhbmdba2V5XSA9IHJlZGVmW2tleV07XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBsYW5nO1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBJbnNlcnQgYSB0b2tlbiBiZWZvcmUgYW5vdGhlciB0b2tlbiBpbiBhIGxhbmd1YWdlIGxpdGVyYWxcblx0XHQgKiBBcyB0aGlzIG5lZWRzIHRvIHJlY3JlYXRlIHRoZSBvYmplY3QgKHdlIGNhbm5vdCBhY3R1YWxseSBpbnNlcnQgYmVmb3JlIGtleXMgaW4gb2JqZWN0IGxpdGVyYWxzKSxcblx0XHQgKiB3ZSBjYW5ub3QganVzdCBwcm92aWRlIGFuIG9iamVjdCwgd2UgbmVlZCBhbm9iamVjdCBhbmQgYSBrZXkuXG5cdFx0ICogQHBhcmFtIGluc2lkZSBUaGUga2V5IChvciBsYW5ndWFnZSBpZCkgb2YgdGhlIHBhcmVudFxuXHRcdCAqIEBwYXJhbSBiZWZvcmUgVGhlIGtleSB0byBpbnNlcnQgYmVmb3JlLiBJZiBub3QgcHJvdmlkZWQsIHRoZSBmdW5jdGlvbiBhcHBlbmRzIGluc3RlYWQuXG5cdFx0ICogQHBhcmFtIGluc2VydCBPYmplY3Qgd2l0aCB0aGUga2V5L3ZhbHVlIHBhaXJzIHRvIGluc2VydFxuXHRcdCAqIEBwYXJhbSByb290IFRoZSBvYmplY3QgdGhhdCBjb250YWlucyBgaW5zaWRlYC4gSWYgZXF1YWwgdG8gUHJpc20ubGFuZ3VhZ2VzLCBpdCBjYW4gYmUgb21pdHRlZC5cblx0XHQgKi9cblx0XHRpbnNlcnRCZWZvcmU6IGZ1bmN0aW9uIChpbnNpZGUsIGJlZm9yZSwgaW5zZXJ0LCByb290KSB7XG5cdFx0XHRyb290ID0gcm9vdCB8fCBfLmxhbmd1YWdlcztcblx0XHRcdHZhciBncmFtbWFyID0gcm9vdFtpbnNpZGVdO1xuXG5cdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAyKSB7XG5cdFx0XHRcdGluc2VydCA9IGFyZ3VtZW50c1sxXTtcblxuXHRcdFx0XHRmb3IgKHZhciBuZXdUb2tlbiBpbiBpbnNlcnQpIHtcblx0XHRcdFx0XHRpZiAoaW5zZXJ0Lmhhc093blByb3BlcnR5KG5ld1Rva2VuKSkge1xuXHRcdFx0XHRcdFx0Z3JhbW1hcltuZXdUb2tlbl0gPSBpbnNlcnRbbmV3VG9rZW5dO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBncmFtbWFyO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgcmV0ID0ge307XG5cblx0XHRcdGZvciAodmFyIHRva2VuIGluIGdyYW1tYXIpIHtcblxuXHRcdFx0XHRpZiAoZ3JhbW1hci5oYXNPd25Qcm9wZXJ0eSh0b2tlbikpIHtcblxuXHRcdFx0XHRcdGlmICh0b2tlbiA9PSBiZWZvcmUpIHtcblxuXHRcdFx0XHRcdFx0Zm9yICh2YXIgbmV3VG9rZW4gaW4gaW5zZXJ0KSB7XG5cblx0XHRcdFx0XHRcdFx0aWYgKGluc2VydC5oYXNPd25Qcm9wZXJ0eShuZXdUb2tlbikpIHtcblx0XHRcdFx0XHRcdFx0XHRyZXRbbmV3VG9rZW5dID0gaW5zZXJ0W25ld1Rva2VuXTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldFt0b2tlbl0gPSBncmFtbWFyW3Rva2VuXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBVcGRhdGUgcmVmZXJlbmNlcyBpbiBvdGhlciBsYW5ndWFnZSBkZWZpbml0aW9uc1xuXHRcdFx0Xy5sYW5ndWFnZXMuREZTKF8ubGFuZ3VhZ2VzLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG5cdFx0XHRcdGlmICh2YWx1ZSA9PT0gcm9vdFtpbnNpZGVdICYmIGtleSAhPSBpbnNpZGUpIHtcblx0XHRcdFx0XHR0aGlzW2tleV0gPSByZXQ7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gcm9vdFtpbnNpZGVdID0gcmV0O1xuXHRcdH0sXG5cblx0XHQvLyBUcmF2ZXJzZSBhIGxhbmd1YWdlIGRlZmluaXRpb24gd2l0aCBEZXB0aCBGaXJzdCBTZWFyY2hcblx0XHRERlM6IGZ1bmN0aW9uKG8sIGNhbGxiYWNrLCB0eXBlLCB2aXNpdGVkKSB7XG5cdFx0XHR2aXNpdGVkID0gdmlzaXRlZCB8fCB7fTtcblx0XHRcdGZvciAodmFyIGkgaW4gbykge1xuXHRcdFx0XHRpZiAoby5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0XHRcdGNhbGxiYWNrLmNhbGwobywgaSwgb1tpXSwgdHlwZSB8fCBpKTtcblxuXHRcdFx0XHRcdGlmIChfLnV0aWwudHlwZShvW2ldKSA9PT0gJ09iamVjdCcgJiYgIXZpc2l0ZWRbXy51dGlsLm9iaklkKG9baV0pXSkge1xuXHRcdFx0XHRcdFx0dmlzaXRlZFtfLnV0aWwub2JqSWQob1tpXSldID0gdHJ1ZTtcblx0XHRcdFx0XHRcdF8ubGFuZ3VhZ2VzLkRGUyhvW2ldLCBjYWxsYmFjaywgbnVsbCwgdmlzaXRlZCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2UgaWYgKF8udXRpbC50eXBlKG9baV0pID09PSAnQXJyYXknICYmICF2aXNpdGVkW18udXRpbC5vYmpJZChvW2ldKV0pIHtcblx0XHRcdFx0XHRcdHZpc2l0ZWRbXy51dGlsLm9iaklkKG9baV0pXSA9IHRydWU7XG5cdFx0XHRcdFx0XHRfLmxhbmd1YWdlcy5ERlMob1tpXSwgY2FsbGJhY2ssIGksIHZpc2l0ZWQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0cGx1Z2luczoge30sXG5cblx0aGlnaGxpZ2h0QWxsOiBmdW5jdGlvbihhc3luYywgY2FsbGJhY2spIHtcblx0XHRfLmhpZ2hsaWdodEFsbFVuZGVyKGRvY3VtZW50LCBhc3luYywgY2FsbGJhY2spO1xuXHR9LFxuXG5cdGhpZ2hsaWdodEFsbFVuZGVyOiBmdW5jdGlvbihjb250YWluZXIsIGFzeW5jLCBjYWxsYmFjaykge1xuXHRcdHZhciBlbnYgPSB7XG5cdFx0XHRjYWxsYmFjazogY2FsbGJhY2ssXG5cdFx0XHRzZWxlY3RvcjogJ2NvZGVbY2xhc3MqPVwibGFuZ3VhZ2UtXCJdLCBbY2xhc3MqPVwibGFuZ3VhZ2UtXCJdIGNvZGUsIGNvZGVbY2xhc3MqPVwibGFuZy1cIl0sIFtjbGFzcyo9XCJsYW5nLVwiXSBjb2RlJ1xuXHRcdH07XG5cblx0XHRfLmhvb2tzLnJ1bihcImJlZm9yZS1oaWdobGlnaHRhbGxcIiwgZW52KTtcblxuXHRcdHZhciBlbGVtZW50cyA9IGVudi5lbGVtZW50cyB8fCBjb250YWluZXIucXVlcnlTZWxlY3RvckFsbChlbnYuc2VsZWN0b3IpO1xuXG5cdFx0Zm9yICh2YXIgaT0wLCBlbGVtZW50OyBlbGVtZW50ID0gZWxlbWVudHNbaSsrXTspIHtcblx0XHRcdF8uaGlnaGxpZ2h0RWxlbWVudChlbGVtZW50LCBhc3luYyA9PT0gdHJ1ZSwgZW52LmNhbGxiYWNrKTtcblx0XHR9XG5cdH0sXG5cblx0aGlnaGxpZ2h0RWxlbWVudDogZnVuY3Rpb24oZWxlbWVudCwgYXN5bmMsIGNhbGxiYWNrKSB7XG5cdFx0Ly8gRmluZCBsYW5ndWFnZVxuXHRcdHZhciBsYW5ndWFnZSwgZ3JhbW1hciwgcGFyZW50ID0gZWxlbWVudDtcblxuXHRcdHdoaWxlIChwYXJlbnQgJiYgIWxhbmcudGVzdChwYXJlbnQuY2xhc3NOYW1lKSkge1xuXHRcdFx0cGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGU7XG5cdFx0fVxuXG5cdFx0aWYgKHBhcmVudCkge1xuXHRcdFx0bGFuZ3VhZ2UgPSAocGFyZW50LmNsYXNzTmFtZS5tYXRjaChsYW5nKSB8fCBbLCcnXSlbMV0udG9Mb3dlckNhc2UoKTtcblx0XHRcdGdyYW1tYXIgPSBfLmxhbmd1YWdlc1tsYW5ndWFnZV07XG5cdFx0fVxuXG5cdFx0Ly8gU2V0IGxhbmd1YWdlIG9uIHRoZSBlbGVtZW50LCBpZiBub3QgcHJlc2VudFxuXHRcdGVsZW1lbnQuY2xhc3NOYW1lID0gZWxlbWVudC5jbGFzc05hbWUucmVwbGFjZShsYW5nLCAnJykucmVwbGFjZSgvXFxzKy9nLCAnICcpICsgJyBsYW5ndWFnZS0nICsgbGFuZ3VhZ2U7XG5cblx0XHRpZiAoZWxlbWVudC5wYXJlbnROb2RlKSB7XG5cdFx0XHQvLyBTZXQgbGFuZ3VhZ2Ugb24gdGhlIHBhcmVudCwgZm9yIHN0eWxpbmdcblx0XHRcdHBhcmVudCA9IGVsZW1lbnQucGFyZW50Tm9kZTtcblxuXHRcdFx0aWYgKC9wcmUvaS50ZXN0KHBhcmVudC5ub2RlTmFtZSkpIHtcblx0XHRcdFx0cGFyZW50LmNsYXNzTmFtZSA9IHBhcmVudC5jbGFzc05hbWUucmVwbGFjZShsYW5nLCAnJykucmVwbGFjZSgvXFxzKy9nLCAnICcpICsgJyBsYW5ndWFnZS0nICsgbGFuZ3VhZ2U7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dmFyIGNvZGUgPSBlbGVtZW50LnRleHRDb250ZW50O1xuXG5cdFx0dmFyIGVudiA9IHtcblx0XHRcdGVsZW1lbnQ6IGVsZW1lbnQsXG5cdFx0XHRsYW5ndWFnZTogbGFuZ3VhZ2UsXG5cdFx0XHRncmFtbWFyOiBncmFtbWFyLFxuXHRcdFx0Y29kZTogY29kZVxuXHRcdH07XG5cblx0XHRfLmhvb2tzLnJ1bignYmVmb3JlLXNhbml0eS1jaGVjaycsIGVudik7XG5cblx0XHRpZiAoIWVudi5jb2RlIHx8ICFlbnYuZ3JhbW1hcikge1xuXHRcdFx0aWYgKGVudi5jb2RlKSB7XG5cdFx0XHRcdF8uaG9va3MucnVuKCdiZWZvcmUtaGlnaGxpZ2h0JywgZW52KTtcblx0XHRcdFx0ZW52LmVsZW1lbnQudGV4dENvbnRlbnQgPSBlbnYuY29kZTtcblx0XHRcdFx0Xy5ob29rcy5ydW4oJ2FmdGVyLWhpZ2hsaWdodCcsIGVudik7XG5cdFx0XHR9XG5cdFx0XHRfLmhvb2tzLnJ1bignY29tcGxldGUnLCBlbnYpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdF8uaG9va3MucnVuKCdiZWZvcmUtaGlnaGxpZ2h0JywgZW52KTtcblxuXHRcdGlmIChhc3luYyAmJiBfc2VsZi5Xb3JrZXIpIHtcblx0XHRcdHZhciB3b3JrZXIgPSBuZXcgV29ya2VyKF8uZmlsZW5hbWUpO1xuXG5cdFx0XHR3b3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24oZXZ0KSB7XG5cdFx0XHRcdGVudi5oaWdobGlnaHRlZENvZGUgPSBldnQuZGF0YTtcblxuXHRcdFx0XHRfLmhvb2tzLnJ1bignYmVmb3JlLWluc2VydCcsIGVudik7XG5cblx0XHRcdFx0ZW52LmVsZW1lbnQuaW5uZXJIVE1MID0gZW52LmhpZ2hsaWdodGVkQ29kZTtcblxuXHRcdFx0XHRjYWxsYmFjayAmJiBjYWxsYmFjay5jYWxsKGVudi5lbGVtZW50KTtcblx0XHRcdFx0Xy5ob29rcy5ydW4oJ2FmdGVyLWhpZ2hsaWdodCcsIGVudik7XG5cdFx0XHRcdF8uaG9va3MucnVuKCdjb21wbGV0ZScsIGVudik7XG5cdFx0XHR9O1xuXG5cdFx0XHR3b3JrZXIucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoe1xuXHRcdFx0XHRsYW5ndWFnZTogZW52Lmxhbmd1YWdlLFxuXHRcdFx0XHRjb2RlOiBlbnYuY29kZSxcblx0XHRcdFx0aW1tZWRpYXRlQ2xvc2U6IHRydWVcblx0XHRcdH0pKTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRlbnYuaGlnaGxpZ2h0ZWRDb2RlID0gXy5oaWdobGlnaHQoZW52LmNvZGUsIGVudi5ncmFtbWFyLCBlbnYubGFuZ3VhZ2UpO1xuXG5cdFx0XHRfLmhvb2tzLnJ1bignYmVmb3JlLWluc2VydCcsIGVudik7XG5cblx0XHRcdGVudi5lbGVtZW50LmlubmVySFRNTCA9IGVudi5oaWdobGlnaHRlZENvZGU7XG5cblx0XHRcdGNhbGxiYWNrICYmIGNhbGxiYWNrLmNhbGwoZWxlbWVudCk7XG5cblx0XHRcdF8uaG9va3MucnVuKCdhZnRlci1oaWdobGlnaHQnLCBlbnYpO1xuXHRcdFx0Xy5ob29rcy5ydW4oJ2NvbXBsZXRlJywgZW52KTtcblx0XHR9XG5cdH0sXG5cblx0aGlnaGxpZ2h0OiBmdW5jdGlvbiAodGV4dCwgZ3JhbW1hciwgbGFuZ3VhZ2UpIHtcblx0XHR2YXIgZW52ID0ge1xuXHRcdFx0Y29kZTogdGV4dCxcblx0XHRcdGdyYW1tYXI6IGdyYW1tYXIsXG5cdFx0XHRsYW5ndWFnZTogbGFuZ3VhZ2Vcblx0XHR9O1xuXHRcdF8uaG9va3MucnVuKCdiZWZvcmUtdG9rZW5pemUnLCBlbnYpO1xuXHRcdGVudi50b2tlbnMgPSBfLnRva2VuaXplKGVudi5jb2RlLCBlbnYuZ3JhbW1hcik7XG5cdFx0Xy5ob29rcy5ydW4oJ2FmdGVyLXRva2VuaXplJywgZW52KTtcblx0XHRyZXR1cm4gVG9rZW4uc3RyaW5naWZ5KF8udXRpbC5lbmNvZGUoZW52LnRva2VucyksIGVudi5sYW5ndWFnZSk7XG5cdH0sXG5cblx0bWF0Y2hHcmFtbWFyOiBmdW5jdGlvbiAodGV4dCwgc3RyYXJyLCBncmFtbWFyLCBpbmRleCwgc3RhcnRQb3MsIG9uZXNob3QsIHRhcmdldCkge1xuXHRcdHZhciBUb2tlbiA9IF8uVG9rZW47XG5cblx0XHRmb3IgKHZhciB0b2tlbiBpbiBncmFtbWFyKSB7XG5cdFx0XHRpZighZ3JhbW1hci5oYXNPd25Qcm9wZXJ0eSh0b2tlbikgfHwgIWdyYW1tYXJbdG9rZW5dKSB7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodG9rZW4gPT0gdGFyZ2V0KSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHBhdHRlcm5zID0gZ3JhbW1hclt0b2tlbl07XG5cdFx0XHRwYXR0ZXJucyA9IChfLnV0aWwudHlwZShwYXR0ZXJucykgPT09IFwiQXJyYXlcIikgPyBwYXR0ZXJucyA6IFtwYXR0ZXJuc107XG5cblx0XHRcdGZvciAodmFyIGogPSAwOyBqIDwgcGF0dGVybnMubGVuZ3RoOyArK2opIHtcblx0XHRcdFx0dmFyIHBhdHRlcm4gPSBwYXR0ZXJuc1tqXSxcblx0XHRcdFx0XHRpbnNpZGUgPSBwYXR0ZXJuLmluc2lkZSxcblx0XHRcdFx0XHRsb29rYmVoaW5kID0gISFwYXR0ZXJuLmxvb2tiZWhpbmQsXG5cdFx0XHRcdFx0Z3JlZWR5ID0gISFwYXR0ZXJuLmdyZWVkeSxcblx0XHRcdFx0XHRsb29rYmVoaW5kTGVuZ3RoID0gMCxcblx0XHRcdFx0XHRhbGlhcyA9IHBhdHRlcm4uYWxpYXM7XG5cblx0XHRcdFx0aWYgKGdyZWVkeSAmJiAhcGF0dGVybi5wYXR0ZXJuLmdsb2JhbCkge1xuXHRcdFx0XHRcdC8vIFdpdGhvdXQgdGhlIGdsb2JhbCBmbGFnLCBsYXN0SW5kZXggd29uJ3Qgd29ya1xuXHRcdFx0XHRcdHZhciBmbGFncyA9IHBhdHRlcm4ucGF0dGVybi50b1N0cmluZygpLm1hdGNoKC9baW11eV0qJC8pWzBdO1xuXHRcdFx0XHRcdHBhdHRlcm4ucGF0dGVybiA9IFJlZ0V4cChwYXR0ZXJuLnBhdHRlcm4uc291cmNlLCBmbGFncyArIFwiZ1wiKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHBhdHRlcm4gPSBwYXR0ZXJuLnBhdHRlcm4gfHwgcGF0dGVybjtcblxuXHRcdFx0XHQvLyBEb27igJl0IGNhY2hlIGxlbmd0aCBhcyBpdCBjaGFuZ2VzIGR1cmluZyB0aGUgbG9vcFxuXHRcdFx0XHRmb3IgKHZhciBpID0gaW5kZXgsIHBvcyA9IHN0YXJ0UG9zOyBpIDwgc3RyYXJyLmxlbmd0aDsgcG9zICs9IHN0cmFycltpXS5sZW5ndGgsICsraSkge1xuXG5cdFx0XHRcdFx0dmFyIHN0ciA9IHN0cmFycltpXTtcblxuXHRcdFx0XHRcdGlmIChzdHJhcnIubGVuZ3RoID4gdGV4dC5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdC8vIFNvbWV0aGluZyB3ZW50IHRlcnJpYmx5IHdyb25nLCBBQk9SVCwgQUJPUlQhXG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKHN0ciBpbnN0YW5jZW9mIFRva2VuKSB7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoZ3JlZWR5ICYmIGkgIT0gc3RyYXJyLmxlbmd0aCAtIDEpIHtcblx0XHRcdFx0XHRcdHBhdHRlcm4ubGFzdEluZGV4ID0gcG9zO1xuXHRcdFx0XHRcdFx0dmFyIG1hdGNoID0gcGF0dGVybi5leGVjKHRleHQpO1xuXHRcdFx0XHRcdFx0aWYgKCFtYXRjaCkge1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0dmFyIGZyb20gPSBtYXRjaC5pbmRleCArIChsb29rYmVoaW5kID8gbWF0Y2hbMV0ubGVuZ3RoIDogMCksXG5cdFx0XHRcdFx0XHQgICAgdG8gPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aCxcblx0XHRcdFx0XHRcdCAgICBrID0gaSxcblx0XHRcdFx0XHRcdCAgICBwID0gcG9zO1xuXG5cdFx0XHRcdFx0XHRmb3IgKHZhciBsZW4gPSBzdHJhcnIubGVuZ3RoOyBrIDwgbGVuICYmIChwIDwgdG8gfHwgKCFzdHJhcnJba10udHlwZSAmJiAhc3RyYXJyW2sgLSAxXS5ncmVlZHkpKTsgKytrKSB7XG5cdFx0XHRcdFx0XHRcdHAgKz0gc3RyYXJyW2tdLmxlbmd0aDtcblx0XHRcdFx0XHRcdFx0Ly8gTW92ZSB0aGUgaW5kZXggaSB0byB0aGUgZWxlbWVudCBpbiBzdHJhcnIgdGhhdCBpcyBjbG9zZXN0IHRvIGZyb21cblx0XHRcdFx0XHRcdFx0aWYgKGZyb20gPj0gcCkge1xuXHRcdFx0XHRcdFx0XHRcdCsraTtcblx0XHRcdFx0XHRcdFx0XHRwb3MgPSBwO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8vIElmIHN0cmFycltpXSBpcyBhIFRva2VuLCB0aGVuIHRoZSBtYXRjaCBzdGFydHMgaW5zaWRlIGFub3RoZXIgVG9rZW4sIHdoaWNoIGlzIGludmFsaWRcblx0XHRcdFx0XHRcdGlmIChzdHJhcnJbaV0gaW5zdGFuY2VvZiBUb2tlbikge1xuXHRcdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Ly8gTnVtYmVyIG9mIHRva2VucyB0byBkZWxldGUgYW5kIHJlcGxhY2Ugd2l0aCB0aGUgbmV3IG1hdGNoXG5cdFx0XHRcdFx0XHRkZWxOdW0gPSBrIC0gaTtcblx0XHRcdFx0XHRcdHN0ciA9IHRleHQuc2xpY2UocG9zLCBwKTtcblx0XHRcdFx0XHRcdG1hdGNoLmluZGV4IC09IHBvcztcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cGF0dGVybi5sYXN0SW5kZXggPSAwO1xuXG5cdFx0XHRcdFx0XHR2YXIgbWF0Y2ggPSBwYXR0ZXJuLmV4ZWMoc3RyKSxcblx0XHRcdFx0XHRcdFx0ZGVsTnVtID0gMTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoIW1hdGNoKSB7XG5cdFx0XHRcdFx0XHRpZiAob25lc2hvdCkge1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYobG9va2JlaGluZCkge1xuXHRcdFx0XHRcdFx0bG9va2JlaGluZExlbmd0aCA9IG1hdGNoWzFdID8gbWF0Y2hbMV0ubGVuZ3RoIDogMDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR2YXIgZnJvbSA9IG1hdGNoLmluZGV4ICsgbG9va2JlaGluZExlbmd0aCxcblx0XHRcdFx0XHQgICAgbWF0Y2ggPSBtYXRjaFswXS5zbGljZShsb29rYmVoaW5kTGVuZ3RoKSxcblx0XHRcdFx0XHQgICAgdG8gPSBmcm9tICsgbWF0Y2gubGVuZ3RoLFxuXHRcdFx0XHRcdCAgICBiZWZvcmUgPSBzdHIuc2xpY2UoMCwgZnJvbSksXG5cdFx0XHRcdFx0ICAgIGFmdGVyID0gc3RyLnNsaWNlKHRvKTtcblxuXHRcdFx0XHRcdHZhciBhcmdzID0gW2ksIGRlbE51bV07XG5cblx0XHRcdFx0XHRpZiAoYmVmb3JlKSB7XG5cdFx0XHRcdFx0XHQrK2k7XG5cdFx0XHRcdFx0XHRwb3MgKz0gYmVmb3JlLmxlbmd0aDtcblx0XHRcdFx0XHRcdGFyZ3MucHVzaChiZWZvcmUpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHZhciB3cmFwcGVkID0gbmV3IFRva2VuKHRva2VuLCBpbnNpZGU/IF8udG9rZW5pemUobWF0Y2gsIGluc2lkZSkgOiBtYXRjaCwgYWxpYXMsIG1hdGNoLCBncmVlZHkpO1xuXG5cdFx0XHRcdFx0YXJncy5wdXNoKHdyYXBwZWQpO1xuXG5cdFx0XHRcdFx0aWYgKGFmdGVyKSB7XG5cdFx0XHRcdFx0XHRhcmdzLnB1c2goYWZ0ZXIpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdEFycmF5LnByb3RvdHlwZS5zcGxpY2UuYXBwbHkoc3RyYXJyLCBhcmdzKTtcblxuXHRcdFx0XHRcdGlmIChkZWxOdW0gIT0gMSlcblx0XHRcdFx0XHRcdF8ubWF0Y2hHcmFtbWFyKHRleHQsIHN0cmFyciwgZ3JhbW1hciwgaSwgcG9zLCB0cnVlLCB0b2tlbik7XG5cblx0XHRcdFx0XHRpZiAob25lc2hvdClcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdHRva2VuaXplOiBmdW5jdGlvbih0ZXh0LCBncmFtbWFyLCBsYW5ndWFnZSkge1xuXHRcdHZhciBzdHJhcnIgPSBbdGV4dF07XG5cblx0XHR2YXIgcmVzdCA9IGdyYW1tYXIucmVzdDtcblxuXHRcdGlmIChyZXN0KSB7XG5cdFx0XHRmb3IgKHZhciB0b2tlbiBpbiByZXN0KSB7XG5cdFx0XHRcdGdyYW1tYXJbdG9rZW5dID0gcmVzdFt0b2tlbl07XG5cdFx0XHR9XG5cblx0XHRcdGRlbGV0ZSBncmFtbWFyLnJlc3Q7XG5cdFx0fVxuXG5cdFx0Xy5tYXRjaEdyYW1tYXIodGV4dCwgc3RyYXJyLCBncmFtbWFyLCAwLCAwLCBmYWxzZSk7XG5cblx0XHRyZXR1cm4gc3RyYXJyO1xuXHR9LFxuXG5cdGhvb2tzOiB7XG5cdFx0YWxsOiB7fSxcblxuXHRcdGFkZDogZnVuY3Rpb24gKG5hbWUsIGNhbGxiYWNrKSB7XG5cdFx0XHR2YXIgaG9va3MgPSBfLmhvb2tzLmFsbDtcblxuXHRcdFx0aG9va3NbbmFtZV0gPSBob29rc1tuYW1lXSB8fCBbXTtcblxuXHRcdFx0aG9va3NbbmFtZV0ucHVzaChjYWxsYmFjayk7XG5cdFx0fSxcblxuXHRcdHJ1bjogZnVuY3Rpb24gKG5hbWUsIGVudikge1xuXHRcdFx0dmFyIGNhbGxiYWNrcyA9IF8uaG9va3MuYWxsW25hbWVdO1xuXG5cdFx0XHRpZiAoIWNhbGxiYWNrcyB8fCAhY2FsbGJhY2tzLmxlbmd0aCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGZvciAodmFyIGk9MCwgY2FsbGJhY2s7IGNhbGxiYWNrID0gY2FsbGJhY2tzW2krK107KSB7XG5cdFx0XHRcdGNhbGxiYWNrKGVudik7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59O1xuXG52YXIgVG9rZW4gPSBfLlRva2VuID0gZnVuY3Rpb24odHlwZSwgY29udGVudCwgYWxpYXMsIG1hdGNoZWRTdHIsIGdyZWVkeSkge1xuXHR0aGlzLnR5cGUgPSB0eXBlO1xuXHR0aGlzLmNvbnRlbnQgPSBjb250ZW50O1xuXHR0aGlzLmFsaWFzID0gYWxpYXM7XG5cdC8vIENvcHkgb2YgdGhlIGZ1bGwgc3RyaW5nIHRoaXMgdG9rZW4gd2FzIGNyZWF0ZWQgZnJvbVxuXHR0aGlzLmxlbmd0aCA9IChtYXRjaGVkU3RyIHx8IFwiXCIpLmxlbmd0aHwwO1xuXHR0aGlzLmdyZWVkeSA9ICEhZ3JlZWR5O1xufTtcblxuVG9rZW4uc3RyaW5naWZ5ID0gZnVuY3Rpb24obywgbGFuZ3VhZ2UsIHBhcmVudCkge1xuXHRpZiAodHlwZW9mIG8gPT0gJ3N0cmluZycpIHtcblx0XHRyZXR1cm4gbztcblx0fVxuXG5cdGlmIChfLnV0aWwudHlwZShvKSA9PT0gJ0FycmF5Jykge1xuXHRcdHJldHVybiBvLm1hcChmdW5jdGlvbihlbGVtZW50KSB7XG5cdFx0XHRyZXR1cm4gVG9rZW4uc3RyaW5naWZ5KGVsZW1lbnQsIGxhbmd1YWdlLCBvKTtcblx0XHR9KS5qb2luKCcnKTtcblx0fVxuXG5cdHZhciBlbnYgPSB7XG5cdFx0dHlwZTogby50eXBlLFxuXHRcdGNvbnRlbnQ6IFRva2VuLnN0cmluZ2lmeShvLmNvbnRlbnQsIGxhbmd1YWdlLCBwYXJlbnQpLFxuXHRcdHRhZzogJ3NwYW4nLFxuXHRcdGNsYXNzZXM6IFsndG9rZW4nLCBvLnR5cGVdLFxuXHRcdGF0dHJpYnV0ZXM6IHt9LFxuXHRcdGxhbmd1YWdlOiBsYW5ndWFnZSxcblx0XHRwYXJlbnQ6IHBhcmVudFxuXHR9O1xuXG5cdGlmIChvLmFsaWFzKSB7XG5cdFx0dmFyIGFsaWFzZXMgPSBfLnV0aWwudHlwZShvLmFsaWFzKSA9PT0gJ0FycmF5JyA/IG8uYWxpYXMgOiBbby5hbGlhc107XG5cdFx0QXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoZW52LmNsYXNzZXMsIGFsaWFzZXMpO1xuXHR9XG5cblx0Xy5ob29rcy5ydW4oJ3dyYXAnLCBlbnYpO1xuXG5cdHZhciBhdHRyaWJ1dGVzID0gT2JqZWN0LmtleXMoZW52LmF0dHJpYnV0ZXMpLm1hcChmdW5jdGlvbihuYW1lKSB7XG5cdFx0cmV0dXJuIG5hbWUgKyAnPVwiJyArIChlbnYuYXR0cmlidXRlc1tuYW1lXSB8fCAnJykucmVwbGFjZSgvXCIvZywgJyZxdW90OycpICsgJ1wiJztcblx0fSkuam9pbignICcpO1xuXG5cdHJldHVybiAnPCcgKyBlbnYudGFnICsgJyBjbGFzcz1cIicgKyBlbnYuY2xhc3Nlcy5qb2luKCcgJykgKyAnXCInICsgKGF0dHJpYnV0ZXMgPyAnICcgKyBhdHRyaWJ1dGVzIDogJycpICsgJz4nICsgZW52LmNvbnRlbnQgKyAnPC8nICsgZW52LnRhZyArICc+JztcblxufTtcblxuaWYgKCFfc2VsZi5kb2N1bWVudCkge1xuXHRpZiAoIV9zZWxmLmFkZEV2ZW50TGlzdGVuZXIpIHtcblx0XHQvLyBpbiBOb2RlLmpzXG5cdFx0cmV0dXJuIF9zZWxmLlByaXNtO1xuXHR9XG5cblx0aWYgKCFfLmRpc2FibGVXb3JrZXJNZXNzYWdlSGFuZGxlcikge1xuXHRcdC8vIEluIHdvcmtlclxuXHRcdF9zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXZ0KSB7XG5cdFx0XHR2YXIgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXZ0LmRhdGEpLFxuXHRcdFx0XHRsYW5nID0gbWVzc2FnZS5sYW5ndWFnZSxcblx0XHRcdFx0Y29kZSA9IG1lc3NhZ2UuY29kZSxcblx0XHRcdFx0aW1tZWRpYXRlQ2xvc2UgPSBtZXNzYWdlLmltbWVkaWF0ZUNsb3NlO1xuXG5cdFx0XHRfc2VsZi5wb3N0TWVzc2FnZShfLmhpZ2hsaWdodChjb2RlLCBfLmxhbmd1YWdlc1tsYW5nXSwgbGFuZykpO1xuXHRcdFx0aWYgKGltbWVkaWF0ZUNsb3NlKSB7XG5cdFx0XHRcdF9zZWxmLmNsb3NlKCk7XG5cdFx0XHR9XG5cdFx0fSwgZmFsc2UpO1xuXHR9XG5cblx0cmV0dXJuIF9zZWxmLlByaXNtO1xufVxuXG4vL0dldCBjdXJyZW50IHNjcmlwdCBhbmQgaGlnaGxpZ2h0XG52YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3VycmVudFNjcmlwdCB8fCBbXS5zbGljZS5jYWxsKGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic2NyaXB0XCIpKS5wb3AoKTtcblxuaWYgKHNjcmlwdCkge1xuXHRfLmZpbGVuYW1lID0gc2NyaXB0LnNyYztcblxuXHRpZiAoIV8ubWFudWFsICYmICFzY3JpcHQuaGFzQXR0cmlidXRlKCdkYXRhLW1hbnVhbCcpKSB7XG5cdFx0aWYoZG9jdW1lbnQucmVhZHlTdGF0ZSAhPT0gXCJsb2FkaW5nXCIpIHtcblx0XHRcdGlmICh3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB7XG5cdFx0XHRcdHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoXy5oaWdobGlnaHRBbGwpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0d2luZG93LnNldFRpbWVvdXQoXy5oaWdobGlnaHRBbGwsIDE2KTtcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgXy5oaWdobGlnaHRBbGwpO1xuXHRcdH1cblx0fVxufVxuXG5yZXR1cm4gX3NlbGYuUHJpc207XG5cbn0pKCk7XG5cbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRtb2R1bGUuZXhwb3J0cyA9IFByaXNtO1xufVxuXG4vLyBoYWNrIGZvciBjb21wb25lbnRzIHRvIHdvcmsgY29ycmVjdGx5IGluIG5vZGUuanNcbmlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuXHRnbG9iYWwuUHJpc20gPSBQcmlzbTtcbn1cblxuXG4vKiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgIEJlZ2luIHByaXNtLW1hcmt1cC5qc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xuXG5QcmlzbS5sYW5ndWFnZXMubWFya3VwID0ge1xuXHQnY29tbWVudCc6IC88IS0tW1xcc1xcU10qPy0tPi8sXG5cdCdwcm9sb2cnOiAvPFxcP1tcXHNcXFNdKz9cXD8+Lyxcblx0J2RvY3R5cGUnOiAvPCFET0NUWVBFW1xcc1xcU10rPz4vaSxcblx0J2NkYXRhJzogLzwhXFxbQ0RBVEFcXFtbXFxzXFxTXSo/XV0+L2ksXG5cdCd0YWcnOiB7XG5cdFx0cGF0dGVybjogLzxcXC8/KD8hXFxkKVteXFxzPlxcLz0kPCVdKyg/OlxccytbXlxccz5cXC89XSsoPzo9KD86KFwifCcpKD86XFxcXFtcXHNcXFNdfCg/IVxcMSlbXlxcXFxdKSpcXDF8W15cXHMnXCI+PV0rKSk/KSpcXHMqXFwvPz4vaSxcblx0XHRncmVlZHk6IHRydWUsXG5cdFx0aW5zaWRlOiB7XG5cdFx0XHQndGFnJzoge1xuXHRcdFx0XHRwYXR0ZXJuOiAvXjxcXC8/W15cXHM+XFwvXSsvaSxcblx0XHRcdFx0aW5zaWRlOiB7XG5cdFx0XHRcdFx0J3B1bmN0dWF0aW9uJzogL148XFwvPy8sXG5cdFx0XHRcdFx0J25hbWVzcGFjZSc6IC9eW15cXHM+XFwvOl0rOi9cblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdCdhdHRyLXZhbHVlJzoge1xuXHRcdFx0XHRwYXR0ZXJuOiAvPSg/OihcInwnKSg/OlxcXFxbXFxzXFxTXXwoPyFcXDEpW15cXFxcXSkqXFwxfFteXFxzJ1wiPj1dKykvaSxcblx0XHRcdFx0aW5zaWRlOiB7XG5cdFx0XHRcdFx0J3B1bmN0dWF0aW9uJzogW1xuXHRcdFx0XHRcdFx0L149Lyxcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0cGF0dGVybjogLyhefFteXFxcXF0pW1wiJ10vLFxuXHRcdFx0XHRcdFx0XHRsb29rYmVoaW5kOiB0cnVlXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0J3B1bmN0dWF0aW9uJzogL1xcLz8+Lyxcblx0XHRcdCdhdHRyLW5hbWUnOiB7XG5cdFx0XHRcdHBhdHRlcm46IC9bXlxccz5cXC9dKy8sXG5cdFx0XHRcdGluc2lkZToge1xuXHRcdFx0XHRcdCduYW1lc3BhY2UnOiAvXlteXFxzPlxcLzpdKzovXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdH1cblx0fSxcblx0J2VudGl0eSc6IC8mIz9bXFxkYS16XXsxLDh9Oy9pXG59O1xuXG5QcmlzbS5sYW5ndWFnZXMubWFya3VwWyd0YWcnXS5pbnNpZGVbJ2F0dHItdmFsdWUnXS5pbnNpZGVbJ2VudGl0eSddID1cblx0UHJpc20ubGFuZ3VhZ2VzLm1hcmt1cFsnZW50aXR5J107XG5cbi8vIFBsdWdpbiB0byBtYWtlIGVudGl0eSB0aXRsZSBzaG93IHRoZSByZWFsIGVudGl0eSwgaWRlYSBieSBSb21hbiBLb21hcm92XG5QcmlzbS5ob29rcy5hZGQoJ3dyYXAnLCBmdW5jdGlvbihlbnYpIHtcblxuXHRpZiAoZW52LnR5cGUgPT09ICdlbnRpdHknKSB7XG5cdFx0ZW52LmF0dHJpYnV0ZXNbJ3RpdGxlJ10gPSBlbnYuY29udGVudC5yZXBsYWNlKC8mYW1wOy8sICcmJyk7XG5cdH1cbn0pO1xuXG5QcmlzbS5sYW5ndWFnZXMueG1sID0gUHJpc20ubGFuZ3VhZ2VzLm1hcmt1cDtcblByaXNtLmxhbmd1YWdlcy5odG1sID0gUHJpc20ubGFuZ3VhZ2VzLm1hcmt1cDtcblByaXNtLmxhbmd1YWdlcy5tYXRobWwgPSBQcmlzbS5sYW5ndWFnZXMubWFya3VwO1xuUHJpc20ubGFuZ3VhZ2VzLnN2ZyA9IFByaXNtLmxhbmd1YWdlcy5tYXJrdXA7XG5cblxuLyogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICBCZWdpbiBwcmlzbS1jc3MuanNcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cblxuUHJpc20ubGFuZ3VhZ2VzLmNzcyA9IHtcblx0J2NvbW1lbnQnOiAvXFwvXFwqW1xcc1xcU10qP1xcKlxcLy8sXG5cdCdhdHJ1bGUnOiB7XG5cdFx0cGF0dGVybjogL0BbXFx3LV0rPy4qPyg/Ojt8KD89XFxzKlxceykpL2ksXG5cdFx0aW5zaWRlOiB7XG5cdFx0XHQncnVsZSc6IC9AW1xcdy1dKy9cblx0XHRcdC8vIFNlZSByZXN0IGJlbG93XG5cdFx0fVxuXHR9LFxuXHQndXJsJzogL3VybFxcKCg/OihbXCInXSkoPzpcXFxcKD86XFxyXFxufFtcXHNcXFNdKXwoPyFcXDEpW15cXFxcXFxyXFxuXSkqXFwxfC4qPylcXCkvaSxcblx0J3NlbGVjdG9yJzogL1tee31cXHNdW157fTtdKj8oPz1cXHMqXFx7KS8sXG5cdCdzdHJpbmcnOiB7XG5cdFx0cGF0dGVybjogLyhcInwnKSg/OlxcXFwoPzpcXHJcXG58W1xcc1xcU10pfCg/IVxcMSlbXlxcXFxcXHJcXG5dKSpcXDEvLFxuXHRcdGdyZWVkeTogdHJ1ZVxuXHR9LFxuXHQncHJvcGVydHknOiAvWy1fYS16XFx4QTAtXFx1RkZGRl1bLVxcd1xceEEwLVxcdUZGRkZdKig/PVxccyo6KS9pLFxuXHQnaW1wb3J0YW50JzogL1xcQiFpbXBvcnRhbnRcXGIvaSxcblx0J2Z1bmN0aW9uJzogL1stYS16MC05XSsoPz1cXCgpL2ksXG5cdCdwdW5jdHVhdGlvbic6IC9bKCl7fTs6XS9cbn07XG5cblByaXNtLmxhbmd1YWdlcy5jc3NbJ2F0cnVsZSddLmluc2lkZS5yZXN0ID0gUHJpc20ubGFuZ3VhZ2VzLmNzcztcblxuaWYgKFByaXNtLmxhbmd1YWdlcy5tYXJrdXApIHtcblx0UHJpc20ubGFuZ3VhZ2VzLmluc2VydEJlZm9yZSgnbWFya3VwJywgJ3RhZycsIHtcblx0XHQnc3R5bGUnOiB7XG5cdFx0XHRwYXR0ZXJuOiAvKDxzdHlsZVtcXHNcXFNdKj8+KVtcXHNcXFNdKj8oPz08XFwvc3R5bGU+KS9pLFxuXHRcdFx0bG9va2JlaGluZDogdHJ1ZSxcblx0XHRcdGluc2lkZTogUHJpc20ubGFuZ3VhZ2VzLmNzcyxcblx0XHRcdGFsaWFzOiAnbGFuZ3VhZ2UtY3NzJyxcblx0XHRcdGdyZWVkeTogdHJ1ZVxuXHRcdH1cblx0fSk7XG5cblx0UHJpc20ubGFuZ3VhZ2VzLmluc2VydEJlZm9yZSgnaW5zaWRlJywgJ2F0dHItdmFsdWUnLCB7XG5cdFx0J3N0eWxlLWF0dHInOiB7XG5cdFx0XHRwYXR0ZXJuOiAvXFxzKnN0eWxlPShcInwnKSg/OlxcXFxbXFxzXFxTXXwoPyFcXDEpW15cXFxcXSkqXFwxL2ksXG5cdFx0XHRpbnNpZGU6IHtcblx0XHRcdFx0J2F0dHItbmFtZSc6IHtcblx0XHRcdFx0XHRwYXR0ZXJuOiAvXlxccypzdHlsZS9pLFxuXHRcdFx0XHRcdGluc2lkZTogUHJpc20ubGFuZ3VhZ2VzLm1hcmt1cC50YWcuaW5zaWRlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdCdwdW5jdHVhdGlvbic6IC9eXFxzKj1cXHMqWydcIl18WydcIl1cXHMqJC8sXG5cdFx0XHRcdCdhdHRyLXZhbHVlJzoge1xuXHRcdFx0XHRcdHBhdHRlcm46IC8uKy9pLFxuXHRcdFx0XHRcdGluc2lkZTogUHJpc20ubGFuZ3VhZ2VzLmNzc1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0YWxpYXM6ICdsYW5ndWFnZS1jc3MnXG5cdFx0fVxuXHR9LCBQcmlzbS5sYW5ndWFnZXMubWFya3VwLnRhZyk7XG59XG5cbi8qICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgQmVnaW4gcHJpc20tY2xpa2UuanNcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cblxuUHJpc20ubGFuZ3VhZ2VzLmNsaWtlID0ge1xuXHQnY29tbWVudCc6IFtcblx0XHR7XG5cdFx0XHRwYXR0ZXJuOiAvKF58W15cXFxcXSlcXC9cXCpbXFxzXFxTXSo/KD86XFwqXFwvfCQpLyxcblx0XHRcdGxvb2tiZWhpbmQ6IHRydWVcblx0XHR9LFxuXHRcdHtcblx0XHRcdHBhdHRlcm46IC8oXnxbXlxcXFw6XSlcXC9cXC8uKi8sXG5cdFx0XHRsb29rYmVoaW5kOiB0cnVlLFxuXHRcdFx0Z3JlZWR5OiB0cnVlXG5cdFx0fVxuXHRdLFxuXHQnc3RyaW5nJzoge1xuXHRcdHBhdHRlcm46IC8oW1wiJ10pKD86XFxcXCg/OlxcclxcbnxbXFxzXFxTXSl8KD8hXFwxKVteXFxcXFxcclxcbl0pKlxcMS8sXG5cdFx0Z3JlZWR5OiB0cnVlXG5cdH0sXG5cdCdjbGFzcy1uYW1lJzoge1xuXHRcdHBhdHRlcm46IC8oKD86XFxiKD86Y2xhc3N8aW50ZXJmYWNlfGV4dGVuZHN8aW1wbGVtZW50c3x0cmFpdHxpbnN0YW5jZW9mfG5ldylcXHMrKXwoPzpjYXRjaFxccytcXCgpKVtcXHcuXFxcXF0rL2ksXG5cdFx0bG9va2JlaGluZDogdHJ1ZSxcblx0XHRpbnNpZGU6IHtcblx0XHRcdHB1bmN0dWF0aW9uOiAvWy5cXFxcXS9cblx0XHR9XG5cdH0sXG5cdCdrZXl3b3JkJzogL1xcYig/OmlmfGVsc2V8d2hpbGV8ZG98Zm9yfHJldHVybnxpbnxpbnN0YW5jZW9mfGZ1bmN0aW9ufG5ld3x0cnl8dGhyb3d8Y2F0Y2h8ZmluYWxseXxudWxsfGJyZWFrfGNvbnRpbnVlKVxcYi8sXG5cdCdib29sZWFuJzogL1xcYig/OnRydWV8ZmFsc2UpXFxiLyxcblx0J2Z1bmN0aW9uJzogL1thLXowLTlfXSsoPz1cXCgpL2ksXG5cdCdudW1iZXInOiAvXFxiMHhbXFxkYS1mXStcXGJ8KD86XFxiXFxkK1xcLj9cXGQqfFxcQlxcLlxcZCspKD86ZVsrLV0/XFxkKyk/L2ksXG5cdCdvcGVyYXRvcic6IC8tLT98XFwrXFwrP3whPT89P3w8PT98Pj0/fD09Pz0/fCYmP3xcXHxcXHw/fFxcP3xcXCp8XFwvfH58XFxefCUvLFxuXHQncHVuY3R1YXRpb24nOiAvW3t9W1xcXTsoKSwuOl0vXG59O1xuXG5cbi8qICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgQmVnaW4gcHJpc20tamF2YXNjcmlwdC5qc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xuXG5QcmlzbS5sYW5ndWFnZXMuamF2YXNjcmlwdCA9IFByaXNtLmxhbmd1YWdlcy5leHRlbmQoJ2NsaWtlJywge1xuXHQna2V5d29yZCc6IC9cXGIoPzphc3xhc3luY3xhd2FpdHxicmVha3xjYXNlfGNhdGNofGNsYXNzfGNvbnN0fGNvbnRpbnVlfGRlYnVnZ2VyfGRlZmF1bHR8ZGVsZXRlfGRvfGVsc2V8ZW51bXxleHBvcnR8ZXh0ZW5kc3xmaW5hbGx5fGZvcnxmcm9tfGZ1bmN0aW9ufGdldHxpZnxpbXBsZW1lbnRzfGltcG9ydHxpbnxpbnN0YW5jZW9mfGludGVyZmFjZXxsZXR8bmV3fG51bGx8b2Z8cGFja2FnZXxwcml2YXRlfHByb3RlY3RlZHxwdWJsaWN8cmV0dXJufHNldHxzdGF0aWN8c3VwZXJ8c3dpdGNofHRoaXN8dGhyb3d8dHJ5fHR5cGVvZnx2YXJ8dm9pZHx3aGlsZXx3aXRofHlpZWxkKVxcYi8sXG5cdCdudW1iZXInOiAvXFxiKD86MFt4WF1bXFxkQS1GYS1mXSt8MFtiQl1bMDFdK3wwW29PXVswLTddK3xOYU58SW5maW5pdHkpXFxifCg/OlxcYlxcZCtcXC4/XFxkKnxcXEJcXC5cXGQrKSg/OltFZV1bKy1dP1xcZCspPy8sXG5cdC8vIEFsbG93IGZvciBhbGwgbm9uLUFTQ0lJIGNoYXJhY3RlcnMgKFNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMDA4NDQ0KVxuXHQnZnVuY3Rpb24nOiAvW18kYS16XFx4QTAtXFx1RkZGRl1bJFxcd1xceEEwLVxcdUZGRkZdKig/PVxccypcXCgpL2ksXG5cdCdvcGVyYXRvcic6IC8tWy09XT98XFwrWys9XT98IT0/PT98PDw/PT98Pj4/Pj89P3w9KD86PT0/fD4pP3wmWyY9XT98XFx8W3w9XT98XFwqXFwqPz0/fFxcLz0/fH58XFxePT98JT0/fFxcP3xcXC57M30vXG59KTtcblxuUHJpc20ubGFuZ3VhZ2VzLmluc2VydEJlZm9yZSgnamF2YXNjcmlwdCcsICdrZXl3b3JkJywge1xuXHQncmVnZXgnOiB7XG5cdFx0cGF0dGVybjogLygoPzpefFteJFxcd1xceEEwLVxcdUZGRkYuXCInXFxdKVxcc10pXFxzKilcXC8oXFxbW15cXF1cXHJcXG5dK118XFxcXC58W14vXFxcXFxcW1xcclxcbl0pK1xcL1tnaW15dV17MCw1fSg/PVxccyooJHxbXFxyXFxuLC47fSlcXF1dKSkvLFxuXHRcdGxvb2tiZWhpbmQ6IHRydWUsXG5cdFx0Z3JlZWR5OiB0cnVlXG5cdH0sXG5cdC8vIFRoaXMgbXVzdCBiZSBkZWNsYXJlZCBiZWZvcmUga2V5d29yZCBiZWNhdXNlIHdlIHVzZSBcImZ1bmN0aW9uXCIgaW5zaWRlIHRoZSBsb29rLWZvcndhcmRcblx0J2Z1bmN0aW9uLXZhcmlhYmxlJzoge1xuXHRcdHBhdHRlcm46IC9bXyRhLXpcXHhBMC1cXHVGRkZGXVskXFx3XFx4QTAtXFx1RkZGRl0qKD89XFxzKj1cXHMqKD86ZnVuY3Rpb25cXGJ8KD86XFwoW14oKV0qXFwpfFtfJGEtelxceEEwLVxcdUZGRkZdWyRcXHdcXHhBMC1cXHVGRkZGXSopXFxzKj0+KSkvaSxcblx0XHRhbGlhczogJ2Z1bmN0aW9uJ1xuXHR9LFxuXHQnY29uc3RhbnQnOiAvXFxiW0EtWl1bQS1aXFxkX10qXFxiL1xufSk7XG5cblByaXNtLmxhbmd1YWdlcy5pbnNlcnRCZWZvcmUoJ2phdmFzY3JpcHQnLCAnc3RyaW5nJywge1xuXHQndGVtcGxhdGUtc3RyaW5nJzoge1xuXHRcdHBhdHRlcm46IC9gKD86XFxcXFtcXHNcXFNdfFxcJHtbXn1dK318W15cXFxcYF0pKmAvLFxuXHRcdGdyZWVkeTogdHJ1ZSxcblx0XHRpbnNpZGU6IHtcblx0XHRcdCdpbnRlcnBvbGF0aW9uJzoge1xuXHRcdFx0XHRwYXR0ZXJuOiAvXFwke1tefV0rfS8sXG5cdFx0XHRcdGluc2lkZToge1xuXHRcdFx0XHRcdCdpbnRlcnBvbGF0aW9uLXB1bmN0dWF0aW9uJzoge1xuXHRcdFx0XHRcdFx0cGF0dGVybjogL15cXCR7fH0kLyxcblx0XHRcdFx0XHRcdGFsaWFzOiAncHVuY3R1YXRpb24nXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRyZXN0OiBudWxsIC8vIFNlZSBiZWxvd1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0J3N0cmluZyc6IC9bXFxzXFxTXSsvXG5cdFx0fVxuXHR9XG59KTtcblByaXNtLmxhbmd1YWdlcy5qYXZhc2NyaXB0Wyd0ZW1wbGF0ZS1zdHJpbmcnXS5pbnNpZGVbJ2ludGVycG9sYXRpb24nXS5pbnNpZGUucmVzdCA9IFByaXNtLmxhbmd1YWdlcy5qYXZhc2NyaXB0O1xuXG5pZiAoUHJpc20ubGFuZ3VhZ2VzLm1hcmt1cCkge1xuXHRQcmlzbS5sYW5ndWFnZXMuaW5zZXJ0QmVmb3JlKCdtYXJrdXAnLCAndGFnJywge1xuXHRcdCdzY3JpcHQnOiB7XG5cdFx0XHRwYXR0ZXJuOiAvKDxzY3JpcHRbXFxzXFxTXSo/PilbXFxzXFxTXSo/KD89PFxcL3NjcmlwdD4pL2ksXG5cdFx0XHRsb29rYmVoaW5kOiB0cnVlLFxuXHRcdFx0aW5zaWRlOiBQcmlzbS5sYW5ndWFnZXMuamF2YXNjcmlwdCxcblx0XHRcdGFsaWFzOiAnbGFuZ3VhZ2UtamF2YXNjcmlwdCcsXG5cdFx0XHRncmVlZHk6IHRydWVcblx0XHR9XG5cdH0pO1xufVxuXG5QcmlzbS5sYW5ndWFnZXMuanMgPSBQcmlzbS5sYW5ndWFnZXMuamF2YXNjcmlwdDtcblxuXG4vKiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgIEJlZ2luIHByaXNtLWZpbGUtaGlnaGxpZ2h0LmpzXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXG5cbihmdW5jdGlvbiAoKSB7XG5cdGlmICh0eXBlb2Ygc2VsZiA9PT0gJ3VuZGVmaW5lZCcgfHwgIXNlbGYuUHJpc20gfHwgIXNlbGYuZG9jdW1lbnQgfHwgIWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRzZWxmLlByaXNtLmZpbGVIaWdobGlnaHQgPSBmdW5jdGlvbigpIHtcblxuXHRcdHZhciBFeHRlbnNpb25zID0ge1xuXHRcdFx0J2pzJzogJ2phdmFzY3JpcHQnLFxuXHRcdFx0J3B5JzogJ3B5dGhvbicsXG5cdFx0XHQncmInOiAncnVieScsXG5cdFx0XHQncHMxJzogJ3Bvd2Vyc2hlbGwnLFxuXHRcdFx0J3BzbTEnOiAncG93ZXJzaGVsbCcsXG5cdFx0XHQnc2gnOiAnYmFzaCcsXG5cdFx0XHQnYmF0JzogJ2JhdGNoJyxcblx0XHRcdCdoJzogJ2MnLFxuXHRcdFx0J3RleCc6ICdsYXRleCdcblx0XHR9O1xuXG5cdFx0QXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgncHJlW2RhdGEtc3JjXScpKS5mb3JFYWNoKGZ1bmN0aW9uIChwcmUpIHtcblx0XHRcdHZhciBzcmMgPSBwcmUuZ2V0QXR0cmlidXRlKCdkYXRhLXNyYycpO1xuXG5cdFx0XHR2YXIgbGFuZ3VhZ2UsIHBhcmVudCA9IHByZTtcblx0XHRcdHZhciBsYW5nID0gL1xcYmxhbmcoPzp1YWdlKT8tKFtcXHctXSspXFxiL2k7XG5cdFx0XHR3aGlsZSAocGFyZW50ICYmICFsYW5nLnRlc3QocGFyZW50LmNsYXNzTmFtZSkpIHtcblx0XHRcdFx0cGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGU7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChwYXJlbnQpIHtcblx0XHRcdFx0bGFuZ3VhZ2UgPSAocHJlLmNsYXNzTmFtZS5tYXRjaChsYW5nKSB8fCBbLCAnJ10pWzFdO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWxhbmd1YWdlKSB7XG5cdFx0XHRcdHZhciBleHRlbnNpb24gPSAoc3JjLm1hdGNoKC9cXC4oXFx3KykkLykgfHwgWywgJyddKVsxXTtcblx0XHRcdFx0bGFuZ3VhZ2UgPSBFeHRlbnNpb25zW2V4dGVuc2lvbl0gfHwgZXh0ZW5zaW9uO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgY29kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NvZGUnKTtcblx0XHRcdGNvZGUuY2xhc3NOYW1lID0gJ2xhbmd1YWdlLScgKyBsYW5ndWFnZTtcblxuXHRcdFx0cHJlLnRleHRDb250ZW50ID0gJyc7XG5cblx0XHRcdGNvZGUudGV4dENvbnRlbnQgPSAnTG9hZGluZ+KApic7XG5cblx0XHRcdHByZS5hcHBlbmRDaGlsZChjb2RlKTtcblxuXHRcdFx0dmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG5cdFx0XHR4aHIub3BlbignR0VUJywgc3JjLCB0cnVlKTtcblxuXHRcdFx0eGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0aWYgKHhoci5yZWFkeVN0YXRlID09IDQpIHtcblxuXHRcdFx0XHRcdGlmICh4aHIuc3RhdHVzIDwgNDAwICYmIHhoci5yZXNwb25zZVRleHQpIHtcblx0XHRcdFx0XHRcdGNvZGUudGV4dENvbnRlbnQgPSB4aHIucmVzcG9uc2VUZXh0O1xuXG5cdFx0XHRcdFx0XHRQcmlzbS5oaWdobGlnaHRFbGVtZW50KGNvZGUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmICh4aHIuc3RhdHVzID49IDQwMCkge1xuXHRcdFx0XHRcdFx0Y29kZS50ZXh0Q29udGVudCA9ICfinJYgRXJyb3IgJyArIHhoci5zdGF0dXMgKyAnIHdoaWxlIGZldGNoaW5nIGZpbGU6ICcgKyB4aHIuc3RhdHVzVGV4dDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRjb2RlLnRleHRDb250ZW50ID0gJ+KcliBFcnJvcjogRmlsZSBkb2VzIG5vdCBleGlzdCBvciBpcyBlbXB0eSc7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHR4aHIuc2VuZChudWxsKTtcblx0XHR9KTtcblxuXHRcdGlmIChQcmlzbS5wbHVnaW5zLnRvb2xiYXIpIHtcblx0XHRcdFByaXNtLnBsdWdpbnMudG9vbGJhci5yZWdpc3RlckJ1dHRvbignZG93bmxvYWQtZmlsZScsIGZ1bmN0aW9uIChlbnYpIHtcblx0XHRcdFx0dmFyIHByZSA9IGVudi5lbGVtZW50LnBhcmVudE5vZGU7XG5cdFx0XHRcdGlmICghcHJlIHx8ICEvcHJlL2kudGVzdChwcmUubm9kZU5hbWUpIHx8ICFwcmUuaGFzQXR0cmlidXRlKCdkYXRhLXNyYycpIHx8ICFwcmUuaGFzQXR0cmlidXRlKCdkYXRhLWRvd25sb2FkLWxpbmsnKSkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgc3JjID0gcHJlLmdldEF0dHJpYnV0ZSgnZGF0YS1zcmMnKTtcblx0XHRcdFx0dmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG5cdFx0XHRcdGEudGV4dENvbnRlbnQgPSBwcmUuZ2V0QXR0cmlidXRlKCdkYXRhLWRvd25sb2FkLWxpbmstbGFiZWwnKSB8fCAnRG93bmxvYWQnO1xuXHRcdFx0XHRhLnNldEF0dHJpYnV0ZSgnZG93bmxvYWQnLCAnJyk7XG5cdFx0XHRcdGEuaHJlZiA9IHNyYztcblx0XHRcdFx0cmV0dXJuIGE7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0fTtcblxuXHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgc2VsZi5QcmlzbS5maWxlSGlnaGxpZ2h0KTtcblxufSkoKTsiLCJpbXBvcnQgJ3ByaXNtanMvcHJpc20uanMnO1xuaW1wb3J0ICdwcmlzbWpzL2NvbXBvbmVudHMvcHJpc20tdHdpZyc7XG5pbXBvcnQgJ3ByaXNtanMvY29tcG9uZW50cy9wcmlzbS1qc29uJztcblxuLy8gU2V0dXAgZWFjaCBQYXR0ZXJuXG5jb25zdCBwYXR0ZXJucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wcmltZXItcGF0dGVybicpO1xuXG5wYXR0ZXJucy5mb3JFYWNoKChwYXR0ZXJuKSA9PiB7XG4gICAgcGF0dGVybi5jbGFzc0xpc3QuYWRkKCdwcmltZXItcGF0dGVybi0tZW5oYW5jZWQnKTtcblxuICAgIGNvbnN0IGNvZGVCbG9ja3MgPSBwYXR0ZXJuLnF1ZXJ5U2VsZWN0b3JBbGwoJy5wcmltZXItdGFiX19jb2RlJyk7XG5cbiAgICBjb2RlQmxvY2tzLmZvckVhY2goKGNvZGVCbG9jaykgPT4ge1xuICAgICAgICBQcmlzbS5oaWdobGlnaHRFbGVtZW50KGNvZGVCbG9jayk7XG4gICAgfSk7XG59KTtcblxuLy8gU2V0dXAgZWFjaCBzZXQgb2YgVGFic1xuY29uc3QgdGFicyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wcmltZXItdGFicycpO1xuXG50YWJzLmZvckVhY2goKHRhYnMpID0+IHtcbiAgICBjb25zdCBsaW5rcyA9IHRhYnMucXVlcnlTZWxlY3RvckFsbCgnLnByaW1lci10YWJzLXRvY19fbGluaycpO1xuICAgIGNvbnN0IHBhbmVscyA9IHRhYnMucXVlcnlTZWxlY3RvckFsbCgnLnByaW1lci10YWInKTtcblxuICAgIGxpbmtzLmZvckVhY2goKGxpbmspID0+IHtcbiAgICAgICAgbGluay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgY29uc3QgaWQgPSBsaW5rLmdldEF0dHJpYnV0ZSgnaHJlZicpLnJlcGxhY2UoJyMnLCAnJyk7XG5cbiAgICAgICAgICAgIHBhbmVscy5mb3JFYWNoKChwYW5lbCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChwYW5lbC5pZCA9PT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFuZWwucmVtb3ZlQXR0cmlidXRlKCdoaWRkZW4nKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwYW5lbC5zZXRBdHRyaWJ1dGUoJ2hpZGRlbicsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsaW5rcy5mb3JFYWNoKChsKSA9PiB7XG4gICAgICAgICAgICAgICAgbC5zZXRBdHRyaWJ1dGUoJ2FyaWEtc2VsZWN0ZWQnLCBmYWxzZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGluay5zZXRBdHRyaWJ1dGUoJ2FyaWEtc2VsZWN0ZWQnLCB0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBsaW5rc1swXS5kaXNwYXRjaEV2ZW50KG5ldyBNb3VzZUV2ZW50KCdjbGljaycsIHtcbiAgICAgICAgdmlldzogd2luZG93LFxuICAgICAgICBidWJibGVzOiB0cnVlLFxuICAgICAgICBjYW5jZWxhYmxlOiB0cnVlXG4gICAgfSkpO1xufSk7XG5cbi8vIFNldHVwIGFsbCBTdGF0ZSBvcHRpb25zXG5jb25zdCBzdGF0ZUNvbnRyb2xzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnByaW1lci1wYXR0ZXJuX19zdGF0ZXMnKTtcblxuc3RhdGVDb250cm9scy5mb3JFYWNoKChzdGF0ZUNvbnRyb2wpID0+IHtcbiAgICBjb25zdCBzZWxlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnKTtcbiAgICBzZWxlY3QuY2xhc3NMaXN0LmFkZCgncHJpbWVyLXBhdHRlcm5fX3N0YXRlcy1zZWxlY3QnKTtcblxuICAgIHN0YXRlQ29udHJvbC5xdWVyeVNlbGVjdG9yQWxsKCcucHJpbWVyLXBhdHRlcm5fX3N0YXRlLWxpbmsnKS5mb3JFYWNoKChzdGF0ZSkgPT4ge1xuICAgICAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICAgICAgb3B0aW9uLmlubmVyVGV4dCA9IHN0YXRlLmlubmVyVGV4dDtcbiAgICAgICAgb3B0aW9uLnNldEF0dHJpYnV0ZSgnZGF0YS11cmwnLCBzdGF0ZS5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSk7XG5cbiAgICAgICAgc2VsZWN0LmFwcGVuZENoaWxkKG9wdGlvbik7XG5cbiAgICAgICAgaWYgKHN0YXRlLmNsYXNzTGlzdC5jb250YWlucygncHJpbWVyLXBhdHRlcm5fX3N0YXRlLWxpbmstLWN1cnJlbnQnKSkge1xuICAgICAgICAgICAgc2VsZWN0LnNlbGVjdGVkSW5kZXggPSBzZWxlY3Qub3B0aW9ucy5sZW5ndGggLSAxO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBkaXYuY2xhc3NMaXN0LmFkZCgncHJpbWVyLXBhdHRlcm5fX3N0YXRlcy1zZWxlY3QtY29udGFpbmVyJyk7XG4gICAgZGl2LmFwcGVuZENoaWxkKHNlbGVjdCk7XG5cbiAgICBzdGF0ZUNvbnRyb2wucmVwbGFjZVdpdGgoZGl2KTtcblxuICAgIHNlbGVjdC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRPcHRpb24gPSBldmVudC50YXJnZXQub3B0aW9uc1tldmVudC50YXJnZXQuc2VsZWN0ZWRJbmRleF07XG4gICAgICAgIGNvbnN0IHVybCA9IHNlbGVjdGVkT3B0aW9uLmRhdGFzZXQudXJsO1xuXG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IHVybDtcbiAgICB9KTtcbn0pO1xuIiwiaW1wb3J0IGVsIGZyb20gJy4uL3V0aWxpdGllcy9lbCc7XG5cbmNvbnN0IGtleXMgPSB7XG4gICAgRVNDOiAyNyxcbiAgICBVUDogMzgsXG4gICAgRE9XTjogNDAsXG4gICAgRU5URVI6IDEzLFxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3Mge1xuICAgIGNvbnN0cnVjdG9yKGNvbnRhaW5lciwgbmF2KSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgICAgICB0aGlzLm5hdiA9IG5hdjtcbiAgICAgICAgdGhpcy5pdGVtcyA9IHRoaXMuZ2V0U2VhcmNoRGF0YSgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCA9IC0xO1xuXG4gICAgICAgIGNvbnN0IGlkID0gYHNlYXJjaC0ke0RhdGUubm93KCl9YDtcblxuICAgICAgICB0aGlzLnN1cmZhY2UgPSBlbChgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwicHJpbWVyLXNlYXJjaFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwcmltZXItc2VhcmNoX19jb250cm9sXCI+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbCBmb3I9XCIkeyBpZCB9XCIgY2xhc3M9XCJwcmltZXItc2VhcmNoX19sYWJlbFwiPlNlYXJjaDwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCBpZD1cIiR7IGlkIH1cIiB0eXBlPVwidGV4dFwiIGNsYXNzPVwicHJpbWVyLXNlYXJjaF9faW5wdXRcIiAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDx1bCBjbGFzcz1cInByaW1lci1zZWFyY2hfX3Jlc3VsdHNcIj48L3VsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGApO1xuXG4gICAgICAgIHRoaXMucmVzdWx0c1VsID0gdGhpcy5zdXJmYWNlLnF1ZXJ5U2VsZWN0b3IoJy5wcmltZXItc2VhcmNoX19yZXN1bHRzJyk7XG5cbiAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5zdXJmYWNlKTtcblxuICAgICAgICB0aGlzLnNldHVwRXZlbnRMaXN0ZW5lcnMoKTtcbiAgICB9XG5cbiAgICBzZXR1cEV2ZW50TGlzdGVuZXJzKCkge1xuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgJy5wcmltZXItc2VhcmNoX19pbnB1dCcsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IGtleXMuRVNDKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQudGFyZ2V0LnZhbHVlID0gJyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSBrZXlzLkRPV04pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEN1cnJlbnRJbmRleCh0aGlzLmN1cnJlbnRJbmRleCArIDEpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IGtleXMuVVApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEN1cnJlbnRJbmRleCh0aGlzLmN1cnJlbnRJbmRleCAtIDEpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IGtleXMuRU5URVIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdEluZGV4KHRoaXMuY3VycmVudEluZGV4KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMudXBkYXRlUmVzdWx0cyhldmVudC50YXJnZXQudmFsdWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgJy5wcmltZXItc2VhcmNoX19pbnB1dCcsIChldmVudCkgPT4ge1xuXG4gICAgICAgICAgICB0aGlzLnN1cmZhY2UuY2xhc3NMaXN0LmFkZCgncHJpbWVyLXNlYXJjaC0tZm9jdXMnKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlUmVzdWx0cyhldmVudC50YXJnZXQudmFsdWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCAnLnByaW1lci1zZWFyY2hfX2lucHV0JywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlclJlc3VsdHMoW10pO1xuXG4gICAgICAgICAgICB0aGlzLnN1cmZhY2UuY2xhc3NMaXN0LnJlbW92ZSgncHJpbWVyLXNlYXJjaC0tZm9jdXMnKTtcbiAgICAgICAgICAgIHRoaXMuZGlzYWJsZVNlYXJjaGluZygpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignLnByaW1lci1zZWFyY2hfX2lucHV0JykudmFsdWUgPSAnJztcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2VsZWN0SW5kZXgoaW5kZXgpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IHRoaXMuc3VyZmFjZS5xdWVyeVNlbGVjdG9yQWxsKCcucHJpbWVyLXNlYXJjaF9fcmVzdWx0Jyk7XG5cbiAgICAgICAgaWYgKGluZGV4IDwgcmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IHJlc3VsdHNbaW5kZXhdLnF1ZXJ5U2VsZWN0b3IoJy5wcmltZXItc2VhcmNoX19yZXN1bHQtbGluaycpLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0Q3VycmVudEluZGV4KGluZGV4KSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSB0aGlzLnN1cmZhY2UucXVlcnlTZWxlY3RvckFsbCgnLnByaW1lci1zZWFyY2hfX3Jlc3VsdCcpO1xuXG4gICAgICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gcmVzdWx0cy5sZW5ndGggfHwgaW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlc3VsdHNbdGhpcy5jdXJyZW50SW5kZXhdKSB7XG4gICAgICAgICAgICByZXN1bHRzW3RoaXMuY3VycmVudEluZGV4XS5jbGFzc0xpc3QucmVtb3ZlKCdwcmltZXItc2VhcmNoX19yZXN1bHQtLWN1cnJlbnQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc3VsdHNbaW5kZXhdLmNsYXNzTGlzdC5hZGQoJ3ByaW1lci1zZWFyY2hfX3Jlc3VsdC0tY3VycmVudCcpO1xuXG4gICAgICAgIHRoaXMuY3VycmVudEluZGV4ID0gaW5kZXg7XG5cbiAgICB9XG5cbiAgICBlbmFibGVTZWFyY2hpbmcoKSB7XG4gICAgICAgIHRoaXMuc3VyZmFjZS5jbG9zZXN0KCcucHJpbWVyLXNpZGViYXInKS5jbGFzc0xpc3QuYWRkKCdwcmltZXItc2lkZWJhci0tc2VhcmNoaW5nJyk7XG5cbiAgICAgICAgdGhpcy5jdXJyZW50SW5kZXggPSAtMTtcbiAgICB9XG5cbiAgICBkaXNhYmxlU2VhcmNoaW5nKCkge1xuICAgICAgICB0aGlzLnN1cmZhY2UuY2xvc2VzdCgnLnByaW1lci1zaWRlYmFyJykuY2xhc3NMaXN0LnJlbW92ZSgncHJpbWVyLXNpZGViYXItLXNlYXJjaGluZycpO1xuICAgIH1cblxuICAgIHVwZGF0ZVJlc3VsdHMocXVlcnkpIHtcbiAgICAgICAgaWYgKHF1ZXJ5ID09PSAnJykge1xuICAgICAgICAgICAgdGhpcy5kaXNhYmxlU2VhcmNoaW5nKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVuYWJsZVNlYXJjaGluZygpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IHRoaXMuZ2V0RmlsdGVyZWREYXRhKHF1ZXJ5KTtcblxuICAgICAgICBpZiAocmVzdWx0cy5sZW5ndGggfHwgcXVlcnkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlclJlc3VsdHMocmVzdWx0cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlck5vUmVzdWx0cygpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBnZXRTZWFyY2hEYXRhKCkge1xuICAgICAgICBjb25zdCBhbGxJdGVtcyA9IFtdO1xuXG4gICAgICAgIHRoaXMubmF2LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wcmltZXItbmF2LWl0ZW0tLWxlYWYtbm9kZScpLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxpbmsgPSBpdGVtLnF1ZXJ5U2VsZWN0b3IoJy5wcmltZXItbmF2LWl0ZW1fX2xpbmsnKS5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcbiAgICAgICAgICAgIGNvbnN0IHRpdGxlID0gaXRlbS5xdWVyeVNlbGVjdG9yKCcucHJpbWVyLW5hdi1pdGVtX19saW5rLXRpdGxlJykuaW5uZXJUZXh0O1xuXG4gICAgICAgICAgICBjb25zdCBkYXRhID0ge1xuICAgICAgICAgICAgICAgIGlkOiBpdGVtLmRhdGFzZXQuaWQsXG4gICAgICAgICAgICAgICAgcGF0aDogaXRlbS5kYXRhc2V0LmlkLnNwbGl0KCcvJyksXG4gICAgICAgICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgICAgICAgbGluayxcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYWxsSXRlbXMucHVzaChkYXRhKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGFsbEl0ZW1zLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhLnRpdGxlLmxvY2FsZUNvbXBhcmUoYi50aXRsZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGdldEZpbHRlcmVkRGF0YShxdWVyeSkge1xuICAgICAgICBpZiAocXVlcnkgPT09ICcnKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5pdGVtcy5maWx0ZXIoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLmlkLmluY2x1ZGVzKHF1ZXJ5LnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmVuZGVyUmVzdWx0cyhyZXN1bHRzKSB7XG4gICAgICAgIGNvbnN0IGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgICAgIHJlc3VsdHMuZm9yRWFjaCgocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBsaSA9IGVsKGBcbiAgICAgICAgICAgICAgICA8bGkgY2xhc3M9XCJwcmltZXItc2VhcmNoX19yZXN1bHRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiR7IHJlc3VsdC5saW5rIH1cIiBjbGFzcz1cInByaW1lci1zZWFyY2hfX3Jlc3VsdC1saW5rXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInByaW1lci1zZWFyY2hfX3Jlc3VsdC10aXRsZVwiPiR7IHJlc3VsdC50aXRsZSB9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwcmltZXItc2VhcmNoX19yZXN1bHQtaWRcIj4keyByZXN1bHQuaWQgfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICBgKTtcblxuICAgICAgICAgICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQobGkpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnJlc3VsdHNVbC5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgdGhpcy5yZXN1bHRzVWwuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpO1xuICAgIH1cblxuICAgIHJlbmRlck5vUmVzdWx0cygpIHtcbiAgICAgICAgY29uc3QgbGkgPSBlbChgXG4gICAgICAgICAgICA8bGkgY2xhc3M9XCJwcmltZXItc2VhcmNoX19yZXN1bHQgcHJpbWVyLXNlYXJjaF9fcmVzdWx0LS1lbXB0eVwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwicHJpbWVyLXNlYXJjaF9fcmVzdWx0LXRpdGxlXCI+Tm8gbWF0Y2hlczwvc3Bhbj5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgIGApO1xuXG4gICAgICAgIHRoaXMucmVzdWx0c1VsLmlubmVySFRNTCA9ICcnO1xuICAgICAgICB0aGlzLnJlc3VsdHNVbC5hcHBlbmRDaGlsZChsaSk7XG4gICAgfTtcblxuICAgIGFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBzZWxlY3RvciwgY2FsbGJhY2spIHtcbiAgICAgICAgLy8gaHR0cHM6Ly93d3cucXVpcmtzbW9kZS5vcmcvYmxvZy9hcmNoaXZlcy8yMDA4LzA0L2RlbGVnYXRpbmdfdGhlLmh0bWxcbiAgICAgICAgY29uc3QgY2FwdHVyZUV2ZW50cyA9IFsnZm9jdXMnLCAnYmx1cicsICdjaGFuZ2UnXTtcblxuICAgICAgICBjb25zdCBjYXB0dXJlID0gY2FwdHVyZUV2ZW50cy5pbmRleE9mKGV2ZW50TmFtZSkgIT09IC0xO1xuXG4gICAgICAgIHRoaXMuc3VyZmFjZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXZlbnQudGFyZ2V0Lm1hdGNoZXMoc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBjYXB0dXJlKTtcbiAgICB9XG59O1xuIiwiaW1wb3J0IFNlYXJjaCBmcm9tICcuL3NlYXJjaCc7XG5pbXBvcnQgU2lkZWJhclNtYWxsIGZyb20gJy4vc2lkZWJhci5zbWFsbCc7XG5cbmNvbnN0IHNpZGViYXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucHJpbWVyLXNpZGViYXInKTtcbnNpZGViYXIuY2xhc3NMaXN0LmFkZCgncHJpbWVyLXNpZGViYXItLWVuaGFuY2VkJyk7XG5cbi8vIEhhbmRsZSB0b3AgbGV2ZWwgc2VjdGlvbnNcbmNvbnN0IHNlY3Rpb25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnByaW1lci1zaWRlYmFyLWdyb3VwJyk7XG5cbltdLmZvckVhY2guY2FsbChzZWN0aW9ucywgKHNlY3Rpb24pID0+IHtcbiAgICBzZWN0aW9uLnF1ZXJ5U2VsZWN0b3IoJy5wcmltZXItc2lkZWJhci1ncm91cF9fdGl0bGUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHNlY3Rpb24uY2xhc3NMaXN0LnRvZ2dsZSgncHJpbWVyLXNpZGViYXItZ3JvdXAtLW9wZW4nKTtcbiAgICB9KTtcbn0pO1xuXG4vLyBIYW5kbGUgVHJlZVxuY29uc3QgZ3JvdXBOb2RlVGl0bGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnByaW1lci1uYXYtaXRlbS0taGFzLWNoaWxkcmVuID4gLnByaW1lci1uYXYtaXRlbV9fbGluaycpO1xuXG5bXS5mb3JFYWNoLmNhbGwoZ3JvdXBOb2RlVGl0bGVzLCAobm9kZSkgPT4ge1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldC5ub2RlTmFtZSA9PT0gJ0EnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGNvbnN0IGdyb3VwTm9kZSA9IG5vZGUuY2xvc2VzdCgnLnByaW1lci1uYXYtaXRlbScpO1xuXG4gICAgICAgIGdyb3VwTm9kZS5jbGFzc0xpc3QudG9nZ2xlKCdwcmltZXItbmF2LWl0ZW0tLW9wZW4nKTtcblxuICAgICAgICBpZiAoZ3JvdXBOb2RlLmNsYXNzTGlzdC5jb250YWlucygncHJpbWVyLW5hdi1pdGVtLS1vcGVuJykpIHtcbiAgICAgICAgICAgIGdyb3VwTm9kZS5jbGFzc0xpc3QucmVtb3ZlKCdwcmltZXItbmF2LWl0ZW0tLWNsb3NlZCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ3JvdXBOb2RlLmNsYXNzTGlzdC5hZGQoJ3ByaW1lci1uYXYtaXRlbS0tY2xvc2VkJyk7XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5uZXcgU2VhcmNoKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wcmltZXItc2VhcmNoLWNvbnRhaW5lcicpLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucHJpbWVyLXNpZGViYXJfX25hdicpKTtcbm5ldyBTaWRlYmFyU21hbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnByaW1lci1zaWRlYmFyJykpO1xuIiwiaW1wb3J0IGVsIGZyb20gJy4uL3V0aWxpdGllcy9lbCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHtcbiAgICBjb25zdHJ1Y3RvcihzdXJmYWNlKSB7XG4gICAgICAgIGlmICghKCdtYXRjaE1lZGlhJyBpbiB3aW5kb3cpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN1cmZhY2UgPSBzdXJmYWNlO1xuXG4gICAgICAgIHRoaXMubWVkaWFRdWVyeSA9IHdpbmRvdy5tYXRjaE1lZGlhKCcobWF4LXdpZHRoOiAxMDAwcHgpJyk7XG5cbiAgICAgICAgdGhpcy5tZWRpYVF1ZXJ5LmFkZExpc3RlbmVyKChldmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKGV2ZW50Lm1hdGNoZXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJvb3RzdHJhcCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRlYXJkb3duKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh0aGlzLm1lZGlhUXVlcnkubWF0Y2hlcykge1xuICAgICAgICAgICAgdGhpcy5ib290c3RyYXAoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGJvb3RzdHJhcCgpIHtcblxuICAgICAgICB0aGlzLmJ1cmdlciA9IGVsKGBcbiAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJwcmltZXItYnVyZ2VyXCIgdHlwZT1cImJ1dHRvblwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwicHJpbWVyLWJ1cmdlcl9fdGV4dFwiPlNob3cgTWVudTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICBgKTtcblxuICAgICAgICB0aGlzLmJ1cmdlci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlTWVudSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLm5hdiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wcmltZXItc2lkZWJhcl9fbmF2Jyk7XG5cbiAgICAgICAgdGhpcy5uYXYucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUodGhpcy5idXJnZXIsIHRoaXMubmF2KTtcblxuICAgICAgICB0aGlzLm5hdi5oaWRkZW4gPSB0cnVlO1xuXG4gICAgICAgIHRoaXMuc3VyZmFjZS5jbGFzc0xpc3QuYWRkKCdwcmltZXItc2lkZWJhci0tc21hbGwnKTtcbiAgICB9XG5cbiAgICB0ZWFyZG93bigpIHtcbiAgICAgICAgdGhpcy5zdXJmYWNlLmNsYXNzTGlzdC5yZW1vdmUoJ3ByaW1lci1zaWRlYmFyLS1zbWFsbCcpO1xuXG4gICAgICAgIGlmICh0aGlzLmJ1cmdlcikge1xuICAgICAgICAgICAgdGhpcy5idXJnZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmJ1cmdlcik7XG4gICAgICAgICAgICB0aGlzLmJ1cmdlciA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5uYXYpIHtcbiAgICAgICAgICAgIHRoaXMubmF2LmhpZGRlbiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdG9nZ2xlTWVudSgpIHtcbiAgICAgICAgaWYgKHRoaXMuYnVyZ2VyLmNsYXNzTGlzdC5jb250YWlucygncHJpbWVyLWJ1cmdlci0tb3BlbicpKSB7XG4gICAgICAgICAgICB0aGlzLmJ1cmdlci5jbGFzc0xpc3QucmVtb3ZlKCdwcmltZXItYnVyZ2VyLS1vcGVuJyk7XG4gICAgICAgICAgICB0aGlzLmJ1cmdlci5jbGFzc0xpc3QuYWRkKCdwcmltZXItYnVyZ2VyLS1jbG9zZWQnKTtcbiAgICAgICAgICAgIHRoaXMuYnVyZ2VyLmNoaWxkcmVuWzBdLmlubmVyVGV4dCA9ICdTaG93IE1lbnUnO1xuICAgICAgICAgICAgdGhpcy5uYXYuaGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYnVyZ2VyLmNsYXNzTGlzdC5hZGQoJ3ByaW1lci1idXJnZXItLW9wZW4nKTtcbiAgICAgICAgICAgIHRoaXMuYnVyZ2VyLmNsYXNzTGlzdC5yZW1vdmUoJ3ByaW1lci1idXJnZXItLWNsb3NlZCcpO1xuICAgICAgICAgICAgdGhpcy5idXJnZXIuY2hpbGRyZW5bMF0uaW5uZXJUZXh0ID0gJ0hpZGUgTWVudSc7XG4gICAgICAgICAgICB0aGlzLm5hdi5oaWRkZW4gPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCAnLi91dGlsaXRpZXMvcG9seWZpbGxzJztcbmltcG9ydCAnLi9wYXJ0aWFscy9zaWRlYmFyJztcbmltcG9ydCAnLi9wYXJ0aWFscy9zaWRlYmFyLnNtYWxsJztcbmltcG9ydCAnLi9wYXJ0aWFscy9wYXR0ZXJuJztcbiIsImV4cG9ydCBkZWZhdWx0IChodG1sKSA9PiB7XG4gICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZGl2LmlubmVySFRNTCA9IGh0bWw7XG4gICAgcmV0dXJuIGRpdi5jaGlsZHJlblswXTtcbn07XG4iLCIvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTm9kZUxpc3QvZm9yRWFjaCNQb2x5ZmlsbFxuaWYgKHdpbmRvdy5Ob2RlTGlzdCAmJiAhTm9kZUxpc3QucHJvdG90eXBlLmZvckVhY2gpIHtcbiAgICBOb2RlTGlzdC5wcm90b3R5cGUuZm9yRWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoO1xufVxuXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9TdHJpbmcvaW5jbHVkZXNcbmlmICghU3RyaW5nLnByb3RvdHlwZS5pbmNsdWRlcykge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdHJpbmcucHJvdG90eXBlLCAnaW5jbHVkZXMnLCB7XG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbihzZWFyY2gsIHN0YXJ0KSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0YXJ0ICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgIHN0YXJ0ID0gMFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc3RhcnQgKyBzZWFyY2gubGVuZ3RoID4gdGhpcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5kZXhPZihzZWFyY2gsIHN0YXJ0KSAhPT0gLTFcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pXG59XG5cbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FbGVtZW50L21hdGNoZXNcbmlmICghRWxlbWVudC5wcm90b3R5cGUubWF0Y2hlcykge1xuICAgIEVsZW1lbnQucHJvdG90eXBlLm1hdGNoZXMgPSBFbGVtZW50LnByb3RvdHlwZS5tc01hdGNoZXNTZWxlY3RvciB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFbGVtZW50LnByb3RvdHlwZS53ZWJraXRNYXRjaGVzU2VsZWN0b3I7XG59XG5cbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FbGVtZW50L2Nsb3Nlc3RcbmlmICghRWxlbWVudC5wcm90b3R5cGUuY2xvc2VzdCkge1xuICAgIEVsZW1lbnQucHJvdG90eXBlLmNsb3Nlc3QgPSBmdW5jdGlvbihzKSB7XG4gICAgICAgIHZhciBlbCA9IHRoaXM7XG5cbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgaWYgKGVsLm1hdGNoZXMocykpIHJldHVybiBlbDtcbiAgICAgICAgICAgIGVsID0gZWwucGFyZW50RWxlbWVudCB8fCBlbC5wYXJlbnROb2RlO1xuICAgICAgICB9IHdoaWxlIChlbCAhPT0gbnVsbCAmJiBlbC5ub2RlVHlwZSA9PT0gMSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG59XG4iXX0=
