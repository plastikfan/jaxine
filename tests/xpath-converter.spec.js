'use strict';

(function () {
  const chai = require('chai');
  chai.use(require('dirty-chai'));
  const expect = chai.expect;
  const assert = chai.assert;
  const R = require('ramda');
  const DOMParser = require('xmldom').DOMParser;
  const parser = new DOMParser();

  const xp = require('../lib/xpath-converter');
  const XHelpers = require('./xml-test-helpers');
  const Helpers = require('./test-helpers');
  const { functify } = require('jinxed');

  const getTestOptions = (el) => {
    return {
      id: 'name',
      recurse: 'inherits',
      discards: ['inherits', 'abstract'],
      descendants: {
        by: 'index',
        throwIfCollision: false,
        throwIfMissing: false
      }
    };
  };

  describe('xpath-converter', () => {
    const data = `<?xml version="1.0"?>
      <Application name="pez">
        <Cli>
          <Commands>
            <Command name="leaf" describe="this is a leaf command" type="native"/>
          </Commands>
        </Cli>
      </Application>`;

    context('given: new object / command with no inheritance', () => {
      it('should: return a command object all local attributes', () => {
        const document = parser.parseFromString(data);
        const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

        if (commandsNode) {
          let leafCommandNode = XHelpers.selectElementNodeById('Command', 'name', 'leaf', commandsNode) || {};
          const converter = new xp.XpathConverter(xp.specs.default);
          let command = converter.buildElement(leafCommandNode, commandsNode, getTestOptions);

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('leaf'),
            'describe': R.equals('this is a leaf command'),
            'type': R.equals('native')
          })(command), command);

          expect(result).to.be.true(functify(command));
        } else {
          assert.fail('Couldn\'t get Commands node.');
        }
      });
    });

    context('given: new object with a null spec', () => {
      it('should: throw', () => {
        const document = parser.parseFromString(data);
        const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

        if (commandsNode) {
          expect(() => {
            // eslint-disable-next-line no-new
            new xp.XpathConverter(null);
          }).to.throw();
        } else {
          assert.fail('Couldn\'t get Commands node.');
        }
      });
    });
  });
})();
