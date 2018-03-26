postinstall
===========

Transform files of Node.js modules after installation.

How
---

Depend on this package:
`npm install postinstall --save`

Declare postinstall script in package.json:

```
{
  "name": "mypkg",
  "version": "1.0.0",
  "dependencies": {
    "postinstall": "1"
  },
  "scripts": {
    "postinstall": "postinstall"
  }
}
```

From there, more dependencies and commands can be added:

```
{
  "dependencies": {
    "jquery": "3",
    "postinstall": "1"
  },
  "postinstall": {
    "jquery/dist/jquery.slim.min.js": "link public/js/jquery.min.js",
    "jquery/dist/jquery.slim.min.map": "link public/js/jquery.min.js.map"
  },
  "scripts": {
    "postinstall": "postinstall"
  }
}
```

It is also possible to configure postinstall in another json file:

```
{
  "dependencies": {
    "jquery": "3",
    "postinstall": "1"
  },
  "scripts": {
    "postinstall": "postinstall postinstall.json"
  }
}
```

with postinstall.json containing:
```
"postinstall": {
  "jquery/dist/jquery.slim.min.js": "link public/js/jquery.min.js",
  "jquery/dist/jquery.slim.min.map": "link public/js/jquery.min.js.map"
}
```


Syntax
------

Short form
```
postinstall: {
	"<module>/<input>": "<command> <output>"
}
```

Long form
```
postinstall: {
	"<module>/<input>": {
		"command": "<command>",
		"output": "<output>",
		"<option>": "<value>"
	}
}
```

input can be a path, with an optional star in its filename
output can be a path, with an option star in its filename.

This allows commands to receive multiple files for one output.
If a command really need to process files in a specific order,
one should use the long form option `list` like this:

```
"src/": {
	"command": "concat",
	"output": "dest/bundle.js",
	"list": ["two.js", "one.js"]
}
```


Command
-------

New commands can be added to postinstall and they just need to be available
as `postinstall-<command>` modules exporting a single function:

```
module.exports = function(inputs, output, options) {
	// inputs is an array of paths
	// output is a path
	// options is an object (possibly empty)
	// can return promise
};
```

Bundled commands: link, copy, concat (accepts glob or `list` option).

