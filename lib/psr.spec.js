/*global beforeEach, describe, expect, it*/

var Psr;

Psr = require('./psr.js');

describe('Psr', function () {
    it('constructs with no arguments', function () {
        expect((new Psr()).toString()).toEqual('');
    });
    it('constructs with a string', function () {
        expect((new Psr('* a\nb')).toString()).toEqual('* a\n1:b');
    });
    describe('escaping', function () {
        [
            {
                escaped: "\\n",
                generate: "\n",
                name: "newline",
                input: "\\n",
            },
            {
                escaped: "\\r",
                generate: "\r",
                name: "carriage return",
                input: "\\r",
            },
            {
                escaped: "\\t",
                generate: "\t",
                name: "tab",
                input: "\\t",
            },
            {
                escaped: "v",
                generate: "v",
                name: "invalid",
                input: "\\v",
            },
            {
                escaped: "\\\\",
                generate: "\\",
                name: "backslash",
                input: "\\\\",
            },
            {
                // Need normal character at the end to prevent newline escaping
                escaped: "\\n\\r\\t\\\\ \\n\\r\\t\\\\x",
                generate: "\n\r\t\\ \n\r\t\\x",
                name: "mixed",
                input: "\\n\\r\\t\\\\\\ \\n\\r\\t\\\\\\x",
            }
        ].forEach(function (scenario) {
            describe(scenario.name, function () {
                var instance;

                beforeEach(function () {
                    instance = new Psr('* a\n' + scenario.input);
                });
                it('unescapes properly', function () {
                    expect(instance.generate()).toEqual(scenario.generate);
                });
                it('re-escapes properly', function () {
                    expect(instance.toString()).toEqual('* a\n1:' + scenario.escaped);
                });
            });
        });
    });
    describe('special sequences', function () {
        [
            {
                generate: '[',
                input: '[[]',
                name: 'left bracket'
            },
            {
                generate: ']',
                input: '[]]',
                name: 'right bracket'
            },
            {
                generate: '*',
                input: '[*]',
                name: 'asterisk'
            },
            {
                generate: '#',
                input: '[#]',
                name: 'pound'
            },
            {
                generate: ' ',
                input: '[ ]',
                name: 'space'
            }
        ].forEach(function (scenario) {
            describe(scenario.name, function () {
                var instance;

                beforeEach(function () {
                    instance = new Psr('*a\n' + scenario.input);
                });
                it('generates successfully', function () {
                    expect(instance.generate()).toEqual(scenario.generate);
                });
            });
        });
    });
    describe('generation', function () {
        it('replaces multiple things on one line', function () {
            expect((new Psr('*a\n[b] [b] [b]\n*b\nB!')).generate()).toEqual('B! B! B!');
        });
        it('works recursively', function () {
            expect((new Psr('*a\n[b]\n*b\n[c]\n*c\n[d]\n*d\nyes')).generate()).toEqual('yes');
        });
        it('capitalizes', function () {
            expect((new Psr('*a\n[^b]\n*b\nc')).generate()).toEqual('C');
        });
        it('throws with no rules', function () {
            expect(function () {
                (new Psr()).generate();
            }).toThrow();
        });
        it('replaces bad rules with empty strings', function () {
            expect((new Psr('*a\nb[c]d')).generate()).toEqual('bd');
        });
        it('uses the specified odds', function () {
            var result, tryCount;

            function run() {
                return (new Psr('*a\n[b][b][b][b][b][b][b][b][b]\n*b\nc\n10000:d')).generate();
            }

            result = run();

            for (tryCount = 0; result !== 'ddddddddd' && tryCount < 3; tryCount += 1) {
                result = run();
            }

            expect(result).toEqual('ddddddddd');
        });
    });
    describe('input processing', function () {
        it('converts newlines', function () {
            expect((new Psr('*a\na[b]\r*b\rb[c]\r\n*c\r\nc')).toString()).toEqual("* a\n1:a[b]\n* b\n1:b[c]\n* c\n1:c");
        });
        it('ignores comments', function () {
            expect((new Psr('*a\n# comment\na')).toString()).toEqual("* a\n1:a");
        });
        it('extends lines', function () {
            expect((new Psr('*1\\\n2\n3\\\\\n4\\\\\\\n5\n\\\\\\thing')).toString()).toEqual("* 12\n1:3\\\\\n1:4\\\\5\n1:\\\\\\thing");
        });
        it('sets the weights', function () {
            expect((new Psr('*a\nb\n0:c\n1:d\n2:e')).toString()).toEqual('* a\n1:b\n1:c\n1:d\n2:e');
        });
        it('removes whitespace', function () {
            expect((new Psr('* a\n \t   \t\t b  \t\t  \t')).toString()).toEqual('* a\n1:b');
        });
    });
});
