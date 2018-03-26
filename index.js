var pify = require('util').promisify;
var glob = pify(require('glob'));
var mkdirp = pify(require('mkdirp'));
var resolvePkg = require('resolve-pkg');
var Path = require('path');

exports.prepare = function(obj) {
	return Object.keys(obj).map(function(key) {
		var line = obj[key];
		var command, output, opts;
		if (typeof line == "object") {
			opts = Object.assign({}, line);
			command = line.command;
			output = line.output;
			delete opts.command;
			delete opts.output;
		} else {
			var parts = line.split(' ');
			command = parts.shift();
			output = parts.join(' ');
			opts = {};
		}
		return {
			command: command,
			output: output,
			input: key,
			options: opts
		};
	});
};

exports.process = function(config) {
	var commands = exports.prepare(config);
	return Promise.all(commands.map(function(obj) {
		return Promise.resolve().then(function() {
			processCommand(obj);
		}).catch(function(err) {
			console.error(`postinstall error, skipping ${obj.command} ${obj.input}`, err);
		});
	}));
};

function processCommand(obj) {
	var srcPath = resolvePkg(obj.input) || Path.resolve(obj.input);
	var srcFile = Path.basename(srcPath);

	var commandFn;
	if (obj.command == "link" || obj.command == "copy" || obj.command == "concat") {
		commandFn = require(`./commands/${obj.command}`);
	} else {
		commandFn = require(`postinstall-${obj.command}`);
	}

	var destDir, destFile;
	if (obj.output.endsWith('/')) {
		destDir = obj.output;
	} else {
		destDir = Path.dirname(obj.output);
		destFile = Path.basename(obj.output);
	}

	var star = srcFile.indexOf('*') >= 0;
	var bundle = star && destFile && destFile.indexOf('*') < 0;

	assertRooted(process.cwd(), destDir);
	return mkdirp(destDir).then(function() {
		return glob(srcPath, {
			nosort: true,
			nobrace: true,
			noglobstar: true,
			noext: true
		}).then(function(paths) {
			var list = paths;
			if (paths.length == 1 && obj.options.list) {
				list = obj.options.list.map(function(path) {
					return Path.join(paths[0], path);
				});
			}
			if (bundle || obj.options.list) return commandFn(list, obj.output, obj.options);
			return Promise.all(paths.map(function(input) {
				var outputFile;
				if (star) {
					var inputFile = Path.basename(input);
					if (!destFile) {
						outputFile = inputFile;
					} else { // bundle == false
						// replace * in destFile by the match in input basename
						var reg = new RegExp(srcFile.replace('*', '(\\w+)'));
						var part = reg.exec(inputFile)[1];
						outputFile = destFile.replace('*', part);
					}
				} else {
					outputFile = destFile || srcFile;
				}
				return commandFn([input], Path.join(destDir, outputFile), obj.options);
			}));
		});
	});
}

function assertRooted(root, path) {
	if (!Path.resolve(path).startsWith(root)) {
		throw new Error(`path is not in root:\n ${root}\n ${path}`);
	}
}

