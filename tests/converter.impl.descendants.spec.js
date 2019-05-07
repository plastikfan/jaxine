(function () {
  const chai = require('chai');
  chai.use(require('dirty-chai'));
  const expect = chai.expect;
  const assert = chai.assert;

  const R = require('ramda');
  const DOMParser = require('xmldom').DOMParser;
  const parser = new DOMParser();

  const XHelpers = require('./xml-test-helpers');
  const Helpers = require('./test-helpers');
  const Jaxine = require('../lib/converter');
  const Impl = require('../lib/converter.impl');

  const getTestOptions = (el) => {
    return {
      id: 'name',
      recurse: 'inherits',
      discards: ['inherits', 'abstract']
    };
  };
  const indexBySpec = {
    labels: {
      element: '_',
      descendants: '_children',
      text: '_text',
      attribute: '_attributes'
    },
    attributesType: 'Member',
    descendants: {
      by: 'index',
      attribute: 'name'
    }
  };
  const descendantsLens = R.lensProp(indexBySpec.labels.descendants);
  const descendantsProp = R.prop(indexBySpec.labels.descendants);

  describe('converter:buildElement', () => {
    context.only('index descendants by', () => {
      const tests = [{
        given: 'Element whose children all have a unique name attribute',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
            <Commands>
              <Command name="domain-command" abstract="true">
                <Arguments>
                  <ArgumentRef name="name"/>
                  <ArgumentRef name="header"/>
                  <ArgumentRef name="producer"/>
                  <ArgumentRef name="director"/>
                </Arguments>
              </Command>
            </Commands>
            </Cli>
          </Application>`,
        commandName: 'domain-command',
        verify: (commandsNode, commandNode) => {
          const argumentsNode = XHelpers.selectFirst('.//Arguments', commandsNode);

          if (argumentsNode) {
            const argumentsElement = Impl.buildElement(argumentsNode, commandNode, getTestOptions, indexBySpec);
            const children = descendantsProp(argumentsElement);

            expect(children).to.be.an('object').that.has.all.keys('name', 'header', 'producer', 'director');

            R.forEachObjIndexed((val, name) => {
              expect(val, `${name} key is missing`).to.have.all.keys('_', 'name');
            })(children);
          } else {
            assert.fail('Couldn\'t get Arguments node.');
          }
        }
      },
      {
        given: 'Element where not all children have a name attribute',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
            <Commands>
              <Command name="domain-command" abstract="true">
                <Arguments>
                  <ArgumentRef name="name"/>
                  <ArgumentRef name="header"/>
                  <ArgumentRef xname="producer"/>
                  <ArgumentRef xname="director"/>
                </Arguments>
              </Command>
            </Commands>
            </Cli>
          </Application>`,
        commandName: 'domain-command',
        verify: (commandsNode, commandNode) => {
          const argumentsNode = XHelpers.selectFirst('.//Arguments', commandsNode);

          if (argumentsNode) {
            const argumentsElement = Impl.buildElement(argumentsNode, commandNode, getTestOptions, indexBySpec);
            const children = descendantsProp(argumentsElement);

            expect(children).to.be.an('object');
            expect(R.keys(children).length).to.equal(3);
          } else {
            assert.fail('Couldn\'t get Arguments node.');
          }
        }
      },
      {
        given: 'Element where no children have a name attribute',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
            <Commands>
              <Command name="domain-command" abstract="true">
                <Arguments>
                  <ArgumentRef xname="name"/>
                  <ArgumentRef xname="header"/>
                  <ArgumentRef xname="producer"/>
                  <ArgumentRef xname="director"/>
                </Arguments>
              </Command>
            </Commands>
            </Cli>
          </Application>`,
        commandName: 'domain-command',
        verify: (commandsNode, commandNode) => {
          const argumentsNode = XHelpers.selectFirst('.//Arguments', commandsNode);

          if (argumentsNode) {
            const argumentsElement = Impl.buildElement(argumentsNode, commandNode, getTestOptions, indexBySpec);
            const children = descendantsProp(argumentsElement);

            expect(children).to.be.an('object');
            expect(R.keys(children).length).to.equal(1);
          } else {
            assert.fail('Couldn\'t get Arguments node.');
          }
        }
      },
      {
        given: 'Element whose children all have a name attribute, but some not unique',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
            <Commands>
              <Command name="domain-command" abstract="true">
                <Arguments>
                  <ArgumentRef name="name"/>
                  <ArgumentRef name="header"/>
                  <ArgumentRef name="producer"/>
                  <ArgumentRef name="director" discriminator="A"/>
                  <ArgumentRef name="director" discriminator="B"/>
                </Arguments>
              </Command>
            </Commands>
            </Cli>
          </Application>`,
        commandName: 'domain-command',
        verify: (commandsNode, commandNode) => {
          const argumentsNode = XHelpers.selectFirst('.//Arguments', commandsNode);

          if (argumentsNode) {
            const argumentsElement = Impl.buildElement(argumentsNode, commandNode, getTestOptions, indexBySpec);
            const children = descendantsProp(argumentsElement);

            expect(children).to.be.an('object').that.has.all.keys('name', 'header', 'producer', 'director');
            expect(R.keys(children).length).to.equal(4);

            // The two ArgumentRef's with name=director have the same key, so the last one
            // with that value is retained and all the others are lost.
            //
            const directorArg = children['director'];
            const result = R.whereEq({
              _: 'ArgumentRef',
              name: 'director',
              discriminator: 'B'
            })(directorArg);
            expect(result).to.be.true();
          } else {
            assert.fail('Couldn\'t get Arguments node.');
          }
        }
      },
      {
        given: 'Element whose children all have a name attribute, all of same value',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
            <Commands>
              <Command name="domain-command" abstract="true">
                <Arguments>
                  <ArgumentRef name="director" discriminator="A"/>
                  <ArgumentRef name="director" discriminator="B"/>
                  <ArgumentRef name="director" discriminator="C"/>
                  <ArgumentRef name="director" discriminator="D"/>
                </Arguments>
              </Command>
            </Commands>
            </Cli>
          </Application>`,
        commandName: 'domain-command',
        verify: (commandsNode, commandNode) => {
          const argumentsNode = XHelpers.selectFirst('.//Arguments', commandsNode);

          if (argumentsNode) {
            const argumentsElement = Impl.buildElement(argumentsNode, commandNode, getTestOptions, indexBySpec);
            console.log(`!!! descendants index by name: ${JSON.stringify(argumentsElement)}`);

            const children = descendantsProp(argumentsElement);
            expect(children).to.be.an('object').that.has.all.keys('director');
            expect(R.keys(children).length).to.equal(1);

            // All the ArgumentRef's have the same key of name=director so the last one
            // with that value is retained and all the others are lost.
            //
            const directorArg = children['director'];
            const result = R.whereEq({
              _: 'ArgumentRef',
              name: 'director',
              discriminator: 'D'
            })(directorArg);
            expect(result).to.be.true();
          } else {
            assert.fail('Couldn\'t get Arguments node.');
          }
        }
      }];

      tests.forEach((t) => {
        const document = parser.parseFromString(t.data);
        const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

        if (commandsNode) {
          const commandNode = XHelpers.selectFirst(`./Command[@name="${t.commandName}"]`,
            commandsNode);

          if (commandNode) {
            it(`given: ${t.given}`, () => {
              t.verify(commandsNode, t.commandName);
            });
          } else {
            assert.fail(`Couldn't get Command node named: "${t.commandName}"`);
          }
        } else {
          assert.fail('Couldn\'t get Commands node.');
        }
      });
    });

    context('groupBy', () => {

    });
  });
})();
