# jaxine
Another XML to JSON converter but with additional attribute inheritance and element consolidation. Jaxine uses [xmldom](https://www.npmjs.com/package/xmldom) and [xpath](https://www.npmjs.com/package/xpath) as it primary dependencies in performing XML to JSON conversion. It also takes a slightly different approach to parsing XML in that it is selective in nature, reflecting how clients would use an xpath expression to selectively access certain portions of a document rather than processing the document as a whole.

  Currently, the output generated is of a fixed nature. (It is planned in the future if needs arises, that the user will
be able to pass in a spec object that describes the shape of the transformation to be applied.)

## Install

> npm install jaxine

## Transformation

  :cyclone: Attributes on an element will appear as a member variable of the same name on the current object.

  :snowflake: Element's name will be populated as a member variable named "\_" on the current object.

  :high_brightness: Descendants will be constructed into an array keyed by the literal "_children" on the current object.

## Examples

### Simple XML element

Given a string containing XML content:
```xml
  const data = `<?xml version="1.0"?>
    <Application name="pez">
      <Cli>
        <Commands>
          <Command name="leaf" describe="this is a leaf command" type="native"/>
        </Commands>
      </Cli>
    </Application>`;
```

This (building element '/Application') will be translated into the following JSON structure:

```javascript
  {
    'name': 'pez', // @attribute
    '_': 'Application', // *element-name
    '_children': [{ // <-- "_children" array
      '_': 'Cli', // *
      '_children': [{ // <--
        '_': 'Commands', // *
        '_children': [{ // <--
          'name': 'leaf', // @
          'describe': 'this is a leaf command', // @
          'type': 'native', // @
          '_': 'Command' // *
        }]
      }]
    }]
  };
```

### Inherited and Consolidated Elements via id attribute (in this case id is set to "name", see API)

Given a string containing XML content:

```xml
  const data = `<?xml version="1.0"?>
    <Application name="pez">
      <Cli>
        <Commands>
          <Command name="base-command" abstract="true" source="filesystem-source" enc="mp3">
            <Arguments>
              <ArgumentRef name="loglevel"/>
              <ArgumentRef name="logfile"/>
            </Arguments>
          </Command>
          <Command name="domain-command" abstract="true">
            <Arguments>
              <ArgumentRef name="aname"/>
              <ArgumentRef name="afname"/>
              <ArgumentRef name="header"/>
            </Arguments>
            <ArgumentGroups>
              <Conflicts>
                <ArgumentRef name="name"/>
                <ArgumentRef name="fname"/>
              </Conflicts>
              <Implies>
                <ArgumentRef name="aname"/>
                <ArgumentRef name="afname"/>
              </Implies>
              <Conflicts>
                <ArgumentRef name = "header"/>
                <ArgumentRef name = "gname"/>
                <ArgumentRef name = "cgname"/>
              </Conflicts>
            </ArgumentGroups>
          </Command>
          <Command name="uni-command" abstract="true">
            <Arguments>
              <ArgumentRef name="path"/>
              <ArgumentRef name="filesys"/>
              <ArgumentRef name="tree"/>
            </Arguments>
          </Command>
          <Command name="rename"
            enc="flac"
            describe="Rename albums according to arguments specified (write)."
            inherits="base-command,domain-command,uni-command"> <!-- multiple inheritance -->
            <Arguments>
              <ArgumentRef name="with"/>
              <ArgumentRef name="put"/>
            </Arguments>
          </Command>
        </Commands>
      </Cli>
    </Application>`;
```

... (building element '/Application/Cli/Commands/Command[@name="rename"]') translates to the following JSON:

```javascript
{
  'name': 'rename',
  'source': 'filesystem-source', // inherited from Command name="base-command"
  'enc': 'flac', // Overrides the enc value in inherited Command name="base-command"
  '_': 'Command',
  '_children': [{ // These children are those of the current element Command name="rename"
    '_': 'Arguments',
    '_children': [{
      'name': 'with',
      '_': 'ArgumentRef'
    }, {
      'name': 'put',
      '_': 'ArgumentRef'
    }]
  }, { // <-- Children of element Command name="base-command"
    '_': 'Arguments',
    '_children': [{
      'name': 'loglevel',
      '_': 'ArgumentRef'
    }, {
      'name': 'logfile',
      '_': 'ArgumentRef'
    }]
  }, { // <-- first child of element Command name="domain-command"
    '_': 'Arguments',
    '_children': [{
      'name': 'aname',
      '_': 'ArgumentRef'
    }, {
      'name': 'afname',
      '_': 'ArgumentRef'
    }, {
      'name': 'header',
      '_': 'ArgumentRef'
    }]
  }, { // <-- second child of element Command name="domain-command"
    '_': 'ArgumentGroups',
    '_children': [{
      '_': 'Conflicts',
      '_children': [{
        'name': 'name',
        '_': 'ArgumentRef'
      }, {
        'name': 'fname',
        '_': 'ArgumentRef'
      }]
    }, {
      '_': 'Implies',
      '_children': [{
        'name': 'aname',
        '_': 'ArgumentRef'
      }, {
        'name': 'afname',
        '_': 'ArgumentRef'
      }]
    }, {
      '_': 'Conflicts',
      '_children': [{
        'name': 'header',
        '_': 'ArgumentRef'
      }, {
        'name': 'gname',
        '_': 'ArgumentRef'
      }, {
        'name': 'cgname',
        '_': 'ArgumentRef'
      }]
    }]
  }, { // <-- Children of element Command name="uni-command"
    '_': 'Arguments',
    '_children': [{
      'name': 'path',
      '_': 'ArgumentRef'
    }, {
      'name': 'filesys',
      '_': 'ArgumentRef'
    }, {
      'name': 'tree',
      '_': 'ArgumentRef'
    }]
  }],
  'describe': 'Rename albums according to arguments specified (write).'
};
```

:exclamation: Points of note in this example are:

* Element consolidation and attribute inheritance done via id attribute "name". This means that any attribute defined on an inherited element, will be defined on the inheriting element. So in this example, the XML defines _Command_ element with an attribute _name_=**"rename"** and _inherits_=**"base-command,domain-command,uni-command"**. So all attributes defined in _Command_ with _name_ = **"base-command", "domain-command" or "uni-command"** will be inherited.
* Any attribute defined on an element will override that with the same name from an inherited element, so **"enc"** is set to **"flac"** not **"mp3"** as would have been inherited from **Command name="base-command"**.
* When multiple inheritance is encountered, the right most reference takes precendence, so when _inherits_=**"base-command,domain-command,uni-command"** is encountered, attributes in **uni-command** take precedence over **domain-command**.
* the children of inherited elements become separate entries in the _children for the current element.
* Notice how the **abstract** attribute has been dropped from the generated JSON representation. This is because the user can also define a set of discarded attributes (see API).

### Text nodes

Given a string containing XML content containing text of different types (raw and CDATA)

```xml
  const data = `<?xml version="1.0"?>
    <Application name="pez">
      <Expressions name="content-expressions">
        <Expression name="meta-prefix-expression">
          <Pattern eg="TEXT"> SOME-RAW-TEXT <![CDATA[ .SOME-CDATA-TEXT ]]> <![CDATA[ .SOME-MORE-CDATA-TEXT ]]></Pattern>
        </Expression>
      </Expressions>
    </Application>`;
```

... (building element '/Application/Expressions/Expression[@name="meta-prefix-expression"]') translates to the following JSON:

```javascript
{
  'name': 'meta-prefix-expression',
  '_': 'Expression',
  '_children': [{
    'eg': 'TEXT',
    '_': 'Pattern',
    '_text': 'SOME-RAW-TEXT.SOME-CDATA-TEXT.SOME-MORE-CDATA-TEXT' // consolidated text from multiple text nodes
  }]
}
```

:exclamation: Points of note in this example are:

* Raw text and CDATA text nodes defined for the same element are combined into a single text field on the current object.
* Using xmldom, there is no distinction between Comment nodes and raw/CDATA text nodes, so unfortunately, comments are read in and appear as text. (As long as there no comments in places where real text is expected, this shouldn't be an issue.)

## The API

Consists of a single function: **buildElement**, whose signature is:

> buildElement(elementNode, parentNode, getOptions)

* _elementNode_: the element as selected via xpath, which needs to be translated
* _parentNode_: the parent node of _elementNode_
* _getOptions_: a callback function which accepts a single argument of type string, which indicates the name of the
element currently being built. This is invoked for all descendant elements and allows defining options on a per element type basis. The options returned by _getOptions_ can define the following members:
  * _id_: The name of the attribute that serves as an identifier to distinguish elements of the same type
  * _recurse_: The name of the attribute through which inheritance is invoked.
  * _discards_: An array containing a list of strings defining the attributes which should be discarded an not be present on the resultant JSON representation.

The following shows an example using the **buildElement** function:

```javascript

    const DOMParser = require('xmldom').DOMParser;
    const parser = new DOMParser();
    const xpath = require('xpath');
    const R = require('ramda');

    const optionsMap = {
      'DEFAULT': { id: 'name' },
      'Command': { id: 'name', recurse: 'inherits', discards: ['inherits', 'abstract'] },
      'Tree': { id: 'alias' }
    };

    const getTestOptions = (el) => {
      return R.includes(el, R.keys(optionsMap)) ? optionsMap[el] : optionsMap['DEFAULT'];
    };

    it('An Example', () => {
      const data = `<?xml version="1.0"?>
        <Application name="pez">
          <Cli>
            <Commands>
              <Command name="leaf" describe="this is a leaf command" type="native"/>
            </Commands>
          </Cli>
        </Application>`;

      const document = parser.parseFromString(data);
      const applicationNode = xpath.select(`.//Application[@name="pez"]`, document)

      if (applicationNode) {
        let application = Impl.buildElement(applicationNode, document, getTestOptions);
        console.log(`>>> APPLICATION: ${JSON.stringify(application)}`);
      }

```

:exclamation: Points of note in this example are:

* The parent node in this case was the document root (as obtained from the XML parser). We could easily have selected a different parent node, by using the xpath API to select a different node, and using that as the parent.

* The _getTestOptions_ function here uses the _optionsMap_ as illustrated. The _optionsMap_ has an entry for the _Command_ element, which means that options object will be used for any Command element encountered. _getTestOptions_ will use the DEFAULT entry for any element that is processed that is neither _Command_ or _Tree_. If you invoke buildElement on the _Command_ node (in this case), the callback (_getOptions_) will be invoked just once with the element name set to 'Command'. The callback allows you to define a different options object for each element type encountered whilst processing the descendants of the element you originally invoked _buildElement_ on.

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
