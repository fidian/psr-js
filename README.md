Phrase Structure Rule Grammar
=============================

Do you ever need to generate some repetitive quip or interesting-enough phrase and get bored of the monotony of doing it over and over?  Want to generate unique messages for spamming someone (please don't do that) or build words that appear to be in another language, but are really just gibberish?

Phrase structure rule (PSR) grammar is for you!  Luckily you found this project, so most of the work is already done.  It has been used to create letters to Santa, GUIDs, realistic names, probable addresses, legitimate phone numbers, Elvish words, magic items for D&D, passphrases, and much more.

Briefly, PSR will expand a rule into text.  The text may refer to other rules and those are expanded, recursively.  This approach is generally based on tree structures.

[![NPM][npm-image]][NPM]
[![Build Status][travis-image]][Travis CI]
[![Dependencies][dependencies-image]][Dependencies]
[![Dev Dependencies][devdependencies-image]][Dev Dependencies]


Command-Line Usage
------------------

Install the package with `npm`:

    npm install -g psr

Now run it against your files

    psr input_file.psr

There are example files distributed with this package to generate GUIDs, addresses, passphrases and more.


JavaScript Library Usage
------------------------

Install the package as a dependency:

    npm install --save psr

Then use the library.

    var generator, Psr;

    Psr = require('psr');

Now you have three ways to set up rules.

    // Set up all rules at once
    generator = new Psr(rulesInTextFormat);

    // OR set up rules yourself
    generator = new Psr()

    // This would add rules and all values for a given rule,
    // similar to having all the text initially.
    arrayOfRuleText.forEach(function (ruleText) {
        generator.parse(ruleText);
    });

    // This would add a single value for a rule.  Here we have
    // an object of rules and each property in the object is an array
    // of values.
    Object.keys(rules).forEach(function (ruleName) {
        rules[ruleName].forEach(function (value) {
            generator.addValue(ruleName, value);
            // There is an optional third parameter if you want to specify
            // a weight other than 1.
        });
    });

Time to generate!

    console.log(generator.generate());


Example
-------

So what goes in the text blocks that the `Psr` instance needs?

Nothing really explains what's going on more than a clear example.  The lines that start with `*` indicate rules.  The first rule in the file is what's used for starting generation.  Here's a file that would generate one phrase only: "Jack is going to the store."

    * MAIN
    Jack is going to the store.

The first rule is "MAIN" and so the generator starts with that.  It randomly picks a line of text.  In this case, there's only one option, so it picks the sentence with Jack in it.  Let's make this a little more complex by changing the name and the destination.

    * MAIN
    [NAME] is going to the [PLACE].

    * NAME
    Timothy
    Jack
    Greg

    * PLACE
    library
    store
    shed

With the above rules, we can get "Timothy is going to the shed.", "Jack is going to the library.", "Greg is going to the shed." and others.  In fact, by having 3 names and 3 destinations, we can get a total of 9 different sentences.

Let's make this a bit more interesting and add more description.

    * MAIN
    [NAME] is [JOINER] the [PLACE].
    At the [PLACE], you will find [NAME].

    * NAME
    Timothy
    Jack
    Greg
    Steve

    * PLACE
    library
    store
    shed

    * JOINER
    [WALK] [TO_FROM]
    going to
    coming from

    * WALK
    running
    walking
    skipping
    hopping
    hobbling
    crawling

    * TO_FROM
    to
    from
    towards
    away from
    nearby

With this lengthy example, you can get a bunch of different possibilities.  "Jack is coming from the shed."  "Timothy is crawling nearby the library."  "Steve is walking away from the store."  You can see that we built a bunch of possibilities from just a few simple lines.

When you add more rules, you increase the amount of possibilities dramatically.  With more possibilities you get more variance in what's generated and more flavor in the statements.

With the above example, you will notice that the JOINER only expands to three possible rules.  The first rule, "[WALK] [TO_FROM]" can expand to many possibilities, but it only has a 1/3 chance of being picked if JOINER is used.  To make the output look better, we should have the "[WALK] [TO_FROM]" rule get used more often.

    # Lines starting with a pound or hash character are comments.
    # Comments are ignored.

    # This is just the JOINER rule of the above, larger file.

    * JOINER
    10:[WALK] [TO_FROM]
    1:going to
    1:coming from

With a JOINER rule like this, we give preference to the first rule.  Essentially, we add the numbers on all of the rules.  Then, we pick a random number, then check to see which rule gets it.  10 + 1 + 1 = 12.  Picking a random number, 4, means that we use the first rule.  If I pick 11 or 12, we use the boring "going to" or "coming from" rules.  Essentially, the first rule is 10 times more likely to get picked than either of the "average" rules.

    # This is a completely different example.
    # Do not just add this to the above PSR rules

    * NEW_EXAMPLE
    Pick up [OBJECT].  [^OBJECT] is over there.

    * OBJECT
    the sword
    an apple
    a kitten

This example illustrates how you can capitalize the first letter in an expanded rule.  The first rule picks two objects (they may be different or the same) and the second object has its first letter capitalized.  "Pick up the sword.  A kitten is over there."  "Pick up an apple.  An apple is over there."  "Pick up a kitten.  An apple is over there."

The file format also supports long lines -- just use something like this:

    This is one really big line.  I continue it to \
    the next line by having a single backslash at \
    the end.

Lastly, if you have `[[]`, `[]]`, `[ ]`, `[*]`, or `[#]` in your rules, it will convert that into just the `[`, `]`, a space, `*`, or `#` character, respectively.  Newlines can be added by using `\n`.


[Dependencies]: https://david-dm.org/fidian/psr-js
[dependencies-image]: https://david-dm.org/fidian/psr-js.png
[Dev Dependencies]: https://david-dm.org/fidian/psr-js#info=devDependencies
[devdependencies-image]: https://david-dm.org/fidian/psr-js/dev-status.png
[NPM]: https://npmjs.org/package/psr-js
[npm-image]: https://nodei.co/npm/psr-js.png?downloads=true&stars=true
[Travis CI]: http://travis-ci.org/fidian/psr-js?branch=master
[travis-image]: https://secure.travis-ci.org/fidian/psr-js.png
