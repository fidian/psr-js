#!/usr/bin/env node

var errorsFound, instance, optionDebug, parser, processFiles, Psr, unparsed;

parser = require('option-parser')();
processFiles = require('process-files');
Psr = require('../');
instance = new Psr();

optionDebug = parser.addOption('d', 'debug', "Dump the parsed rules");
parser.addOption('h', null, "This help message", function () {
    console.log("Process PSR files or read from stdin");
    parser.helpAction();
});

unparsed = parser.parse();

if (!unparsed.length) {
    unparsed = [
        '-'
    ];
}

errorsFound = 0;

processFiles(unparsed, function (err, data) {
    if (err) {
        console.error('Error reading ' + err.filename + ':  ' + err.toString());
        errorsFound += 1;
    } else {
        instance.parse(data);
    }
}, function () {
    if (!errorsFound) {
        if (optionDebug.count()) {
            console.log(instance.toString());
        } else {
            console.log(instance.generate());
        }
    }
});
