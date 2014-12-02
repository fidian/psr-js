/**
 * Phrase Structure Rule parser
 *
 * This looks a lot like an INI file
 * Lines beginning with # are comments.
 * Lines that start with a * indicate the beginning of a rule.
 * Blank lines or those containing only whitespace are ignored.
 * The rest are values.
 *
 * Trailing whitespace on a value is trimmed.
 * Values can start with a number (a weight) followed by a colon.  The default weight is 1.
 * Values can reference another rule by surrounding it in [brackets].
 * Rule names are case sensitive.
 * The expanded rule can be capitalized by prefixing a rule name with a [^carat].
 * Values and rules can be extended on to another line by adding a single backslash at the end.
 * Literal newlines, carriage returns and tabs can be added by using `\n`, `\r`, and `\t`.
 * You can escape backslashes and more with \.
 *     \n = newline
 *     \r = carriage return
 *     \t = tab
 *     All the rest indicate a literal character
 * To add a literal bracket you can use [[] and []] (also [*] and [ ])
 */
// fid-umd {"jslint":1,"name":"PSR"}
/*global define, YUI*/
(function (n, r, f) {
    "use strict";
    try { module.exports = f(); return; } catch (ignore) {}
    try { exports[n] = f(); return; } catch (ignore) {}
    try { return define.amd && define(n, [], f); } catch (ignore) {}
    try { return YUI.add(n, function (Y) { Y[n] = f(); }); } catch (ignore) {}
    try { r[n] = f(); return; } catch (ignore) {}
    throw new Error("Unable to export " + n);
}("PSR", this, function () {
    "use strict";
    // fid-umd end

    var proto;

    /**
     * Constructor
     *
     * The PSR object contains all of the rules and values within rules.
     */
    function PSR(text) {
        if (!(this instanceof PSR)) {
            return new PSR();
        }

        this.rules = {};
        this.startingRule = null;

        if (typeof text === 'string') {
            this.parse(text);
        }
    }

    proto = PSR.prototype;

    /**
     * Adds a value to a rule
     *
     * @param {string} rule
     * @param {string} value
     * @param {number} [weight=1]
     */
    proto.addValue = function (rule, value, weight) {
        var ruleObject;

        if (weight <= 0) {
            weight = 1;
        }

        ruleObject = this.getRule(rule);
        ruleObject.values.push({
            weight: weight,
            value: value
        });
        ruleObject.totalWeight += weight;
    };


    /**
     * Escape a string
     *
     * This is somewhat the opposite of scanString
     *
     * @param {string} input
     * @return {string}
     */
    proto.escapeString = function (input) {
        return input.replace(/\\/g, '\\\\')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    };


    /**
     * Generate a result for a given rule.  When no rule
     * is provided, generate a result for the "main" rule.
     *
     * @param {?string} [rule]
     * @return {string}
     */
    proto.generate = function (rule) {
        var ruleObject, self, value;

        self = this;

        if (typeof rule !== 'string') {
            rule = self.startingRule;

            if (rule === null) {
                throw new Error('No rules are defined');
            }
        }

        // Handle special escapes
        if (rule === ' ' || rule === '*' || rule === '[' || rule === ']' || rule === '#') {
            return rule;
        }

        ruleObject = self.getRule(rule);
        value = self.pickValue(ruleObject);

        // Replace all [...] sequences
        value = value.replace(/\[([\^]?)([^\]]*)\]/g, function (match, carat, rule) {
            /*jslint unparam:true*/
            var result;

            result = self.generate(rule);

            if (carat) {
                result = result.charAt(0).toUpperCase() + result.substr(1);
            }

            return result;
        });

        return value;
    };


    /**
     * @typedef {Object} PSR~ruleObject
     * @property {Array.<string>} values
     * @property {number} totalWeight
     */

    /**
     * Retrieve a rule object or make a new rule object
     *
     * @param {string} rule
     * @return {PSR~ruleObject}
     */
    proto.getRule = function (rule) {
        if (!this.rules[rule]) {
            this.rules[rule] = {
                totalWeight: 0,
                values: []
            };
        }

        if (this.startingRule === null) {
            this.startingRule = rule;
        }

        return this.rules[rule];
    };


    /**
     * Augment existing rules and values.
     *
     * @param {string} text PSR rules and values
     */
    proto.parse = function (text) {
        var line, lines, matches, ruleName, weight;

        lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split(/\n/);
        ruleName = '';

        while (lines.length) {
            line = lines.shift();

            // Ignore comments entirely
            if (line.charAt(0) !== '#') {
                // Handle line continuations
                while (line.match(/(^|[^\\])(\\\\)*\\$/)) {
                    line = line.substr(0, line.length - 1) + lines.shift();
                }

                if (line.charAt(0) === '*') {
                    // Rule
                    ruleName = this.scanString(line.substr(1));
                } else {
                    // Value
                    weight = 1;
                    line = this.scanString(line);
                    matches = line.match(/^([0-9]+):(.*)/);

                    if (matches) {
                        weight = +matches[1];
                        line = matches[2];
                    }

                    if (line.length) {
                        this.addValue(ruleName, line, weight);
                    }
                }
            }
        }
    };


    /**
     * Select a value from a rule object
     *
     * @param {PSR~ruleObject} ruleObject
     * @return {string} value
     */
    proto.pickValue = function (ruleObject) {
        var c, i, length, r;

        length = ruleObject.values.length;

        // No need to weigh the values if they all have a weight of 1
        if (ruleObject.totalWeight === length) {
            if (length === 0) {
                return '';
            }

            return ruleObject.values[Math.floor(Math.random() * length)].value;
        }

        r = Math.floor(Math.random() * ruleObject.totalWeight);

        for (i = 0; i < length; i += 1) {
            c = ruleObject.values[i].weight;

            if (r < c) {
                return ruleObject.values[i].value;
            }

            r -= c;
        }

        // Either no values or something really bad happened
        return '';
    };


    /**
     * Scan a string and perform standard processing routines to it.
     *
     * Trim the beginning of a line
     *
     * @param {string} input
     * @return {string} out
     */
    proto.scanString = function (str) {
        var c, escaped, i, unescaped;

        // Remove leading whitespace
        escaped = str.replace(/^[ \t]*/, '').replace(/[ \t]*$/, '');
        unescaped = '';

        for (i = 0; i < escaped.length; i += 1) {
            c = escaped.charAt(i);

            if (c !== '\\') {
                unescaped += c;
            } else {
                i += 1;
                c = escaped.charAt(i);

                switch (c) {
                case 'n':
                    unescaped += '\n';
                    break;

                case 'r':
                    unescaped += '\r';
                    break;

                case 't':
                    unescaped += '\t';
                    break;

                default:
                    unescaped += c;
                }
            }
        }

        return unescaped;
    };


    /**
     * Return the rule structures in the instance to allow for thorough
     * testing.
     *
     * @return {Object}
     */
    proto.toString = function () {
        var result, self;

        self = this;
        result = [];
        Object.keys(self.rules).forEach(function (ruleName) {
            var ruleObject;

            result.push('* ' + self.escapeString(ruleName));
            ruleObject = self.getRule(ruleName);
            ruleObject.values.forEach(function (valueObject) {
                result.push(valueObject.weight + ':' + self.escapeString(valueObject.value));
            });
        });

        return result.join('\n');
    };

    return PSR;
    // fid-umd post
}));
// fid-umd post-end
