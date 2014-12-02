/**
 * Phrase Structure Rule parser
 *
 * This looks a lot like an INI file
 * Lines beginning with # are comments.
 * Lines that start with a * indicate the beginning of a section.
 * Blank lines or those containing only whitespace are ignored.
 * The rest are rules.
 *
 * Trailing whitespace on a rule is trimmed.
 * Rules can start with a number (a weight) followed by a colon.  The default weight is 1.
 * Rules can reference another rule by surrounding it in [brackets].
 * Rule names are case sensitive.
 * The expanded rule can be capitalized by prefixing a rule name with a [^carat].
 * Rules can be extended on to another line by adding a single backslash at the end.
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
     * The PSR object contains all of the sections and rules within sections.
     */
    function PSR(text) {
        if (!(this instanceof PSR)) {
            return new PSR();
        }

        this.sections = {};
        this.startingSection = null;

        if (typeof text === 'string') {
            this.parse(text);
        }
    }

    proto = PSR.prototype;

    /**
     * Adds a rule to a section
     *
     * @param {string} section
     * @param {string} rule
     * @param {number} [weight=1]
     */
    proto.addRule = function (section, rule, weight) {
        var sectionObject;

        if (weight <= 0) {
            weight = 1;
        }

        sectionObject = this.getSection(section);
        sectionObject.rules.push({
            weight: weight,
            rule: rule
        });
        sectionObject.totalWeight += weight;
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
     * Generate a result for a given section.  When no section
     * is provided, generate a result for the "main" section.
     *
     * @param {?string} [section]
     * @return {string}
     */
    proto.generate = function (section) {
        var rule, sectionObject, self;

        self = this;

        if (typeof section !== 'string') {
            section = self.startingSection;

            if (section === null) {
                throw new Error('No sections are defined');
            }
        }

        // Handle special escapes
        if (section === ' ' || section === '*' || section === '[' || section === ']' || section === '#') {
            return section;
        }

        sectionObject = self.getSection(section);
        rule = self.pickRule(sectionObject);

        // Replace all [...] sequences
        rule = rule.replace(/\[([\^]?)([^\]]*)\]/g, function (match, carat, section) {
            /*jslint unparam:true*/
            var result;

            result = self.generate(section);

            if (carat) {
                result = result.charAt(0).toUpperCase() + result.substr(1);
            }

            return result;
        });

        return rule;
    };


    /**
     * @typedef {Object} PSR~sectionObject
     * @property {Array.<string>} rules
     * @property {number} totalWeight
     */

    /**
     * Retrieve a section object or make a new section object
     *
     * @param {string} section
     * @return {PSR~sectionObject}
     */
    proto.getSection = function (section) {
        if (!this.sections[section]) {
            this.sections[section] = {
                rules: [],
                totalWeight: 0
            };
        }

        if (this.startingSection === null) {
            this.startingSection = section;
        }

        return this.sections[section];
    };


    /**
     * Augment existing sections and rules.
     *
     * @param {string} text PSR sections and rules
     */
    proto.parse = function (text) {
        var line, lines, matches, sectionName, weight;

        lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split(/\n/);
        sectionName = '';

        while (lines.length) {
            line = lines.shift();

            // Ignore comments entirely
            if (line.charAt(0) !== '#') {
                // Handle line continuations
                while (line.match(/(^|[^\\])(\\\\)*\\$/)) {
                    line = line.substr(0, line.length - 1) + lines.shift();
                }

                if (line.charAt(0) === '*') {
                    // Section
                    sectionName = this.scanString(line.substr(1));
                } else {
                    // Rule
                    weight = 1;
                    line = this.scanString(line);
                    matches = line.match(/^([0-9]+):(.*)/);

                    if (matches) {
                        weight = +matches[1];
                        line = matches[2];
                    }

                    if (line.length) {
                        this.addRule(sectionName, line, weight);
                    }
                }
            }
        }
    };


    /**
     * Select a rule from a section object
     *
     * @param {PSR~sectionObject} sectionObject
     * @return {string} rule
     */
    proto.pickRule = function (sectionObject) {
        var c, i, length, r;

        length = sectionObject.rules.length;

        // No need to weigh the rules if they all have a weight of 1
        if (sectionObject.totalWeight === length) {
            if (length === 0) {
                return '';
            }

            return sectionObject.rules[Math.floor(Math.random() * length)].rule;
        }

        r = Math.floor(Math.random() * sectionObject.totalWeight);

        for (i = 0; i < length; i += 1) {
            c = sectionObject.rules[i].weight;

            if (r < c) {
                return sectionObject.rules[i].rule;
            }

            r -= c;
        }

        // Either no rules or something really bad happened
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
        Object.keys(self.sections).forEach(function (sectionName) {
            var sectionObject;

            result.push('* ' + self.escapeString(sectionName));
            sectionObject = self.getSection(sectionName);
            sectionObject.rules.forEach(function (ruleObject) {
                result.push(ruleObject.weight + ':' + self.escapeString(ruleObject.rule));
            });
        });

        return result.join('\n');
    };

    return PSR;
    // fid-umd post
}));
// fid-umd post-end
