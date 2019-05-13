(function () {
  const chai = require('chai');
  chai.use(require('dirty-chai'));
  const expect = chai.expect;
  const assert = chai.assert;

  const R = require('ramda');
  const DOMParser = require('xmldom').DOMParser;
  const parser = new DOMParser();

  const XHelpers = require('./xml-test-helpers');
  const Impl = require('../lib/converter.impl');

  const getTestOptions = (el) => {
    return {
      id: 'name',
      recurse: 'inherits',
      discards: ['inherits', 'abstract'],
      descendants: {
        by: 'index',
        attribute: 'name',
        throwIfCollision: false,
        throwIfMissing: false
      }
    };
  };

  const getTestOptionsThrows = (el) => {
    return {
      id: 'name',
      recurse: 'inherits',
      discards: ['inherits', 'abstract'],
      descendants: {
        by: 'index',
        attribute: 'name',
        throwIfCollision: true,
        throwIfMissing: true
      }
    };
  };

  const indexBySpec = {
    labels: {
      element: '_',
      descendants: '_children',
      text: '_text'
    },
    descendants: {
      by: 'index',
      attribute: 'name',
      throwIfCollision: false,
      throwIfMissing: false
    }
  };
  Object.freeze(indexBySpec);

  const groupBySpec = R.set(R.lensPath(['descendants', 'by']), 'group')(indexBySpec);
  Object.freeze(groupBySpec);

  const indexBySpecThrows = R.mergeDeepRight(indexBySpec, {
    descendants: {
      throwIfCollision: true,
      throwIfMissing: true
    }
  });
  Object.freeze(indexBySpecThrows);

  const descendantsProp = R.prop(indexBySpec.labels.descendants);

  describe('converter.impl:buildElement (descendants)', () => {
    context('index/group descendants by', () => {
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
          it('indexBy should: create element whose descendants are indexed by "name"', () => {
            const argumentsNode = XHelpers.selectFirst('.//Arguments', commandsNode);

            if (argumentsNode) {
              const argumentsElement = Impl.buildElementWithSpec(argumentsNode, commandNode,
                indexBySpec, getTestOptions);
              const children = descendantsProp(argumentsElement);

              expect(children).to.be.an('object').that.has.all.keys(
                'name', 'header', 'producer', 'director');

              R.forEachObjIndexed((val, name) => {
                expect(val, `${name} key is missing`).to.have.all.keys('_', 'name');
              })(children);
            } else {
              assert.fail('Couldn\'t get Arguments node.');
            }
          });
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
          it('indexBy should: create element whose descendants are not indexed', () => {
            const argumentsNode = XHelpers.selectFirst('.//Arguments', commandsNode);

            if (argumentsNode) {
              const argumentsElement = Impl.buildElementWithSpec(argumentsNode, commandNode,
                indexBySpec, getTestOptions);
              const children = descendantsProp(argumentsElement);

              expect(children).to.be.an('array');
              expect(R.keys(children)).to.have.lengthOf(4);
            } else {
              assert.fail('Couldn\'t get Arguments node.');
            }
          });
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
          it('indexBy should: create element whose descendants are not indexed', () => {
            const argumentsNode = XHelpers.selectFirst('.//Arguments', commandsNode);

            if (argumentsNode) {
              const argumentsElement = Impl.buildElementWithSpec(argumentsNode, commandNode,
                indexBySpec, getTestOptions);
              const children = descendantsProp(argumentsElement);

              expect(children).to.be.an('array');
              expect(R.keys(children)).to.have.lengthOf(4);
            } else {
              assert.fail('Couldn\'t get Arguments node.');
            }
          });
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
          it('indexBy should: create element whose descendants are indexed by "name" with lost items', () => {
            const argumentsNode = XHelpers.selectFirst('.//Arguments', commandsNode);

            if (argumentsNode) {
              const argumentsElement = Impl.buildElementWithSpec(argumentsNode, commandNode,
                indexBySpec, getTestOptions);
              const children = descendantsProp(argumentsElement);

              expect(children).to.be.an('object').that.has.all.keys(
                'name', 'header', 'producer', 'director');
              expect(R.keys(children)).to.have.lengthOf(4);

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
          });
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
          it('indexBy should: create element whose descendants are indexed by "name" with lost items', () => {
            const argumentsNode = XHelpers.selectFirst('.//Arguments', commandsNode);

            if (argumentsNode) {
              const argumentsElement = Impl.buildElementWithSpec(argumentsNode, commandNode,
                indexBySpec, getTestOptions);
              const children = descendantsProp(argumentsElement);

              expect(children).to.be.an('object').that.has.all.keys('director');
              expect(R.keys(children)).to.have.lengthOf(1);

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
          });
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
          it('indexBy should: throw on name collision', () => {
            const argumentsNode = XHelpers.selectFirst('.//Arguments', commandsNode);

            if (argumentsNode) {
              expect(() => {
                Impl.buildElementWithSpec(argumentsNode, commandNode,
                  indexBySpecThrows, getTestOptionsThrows);
              }).to.throw();
            } else {
              assert.fail('Couldn\'t get Arguments node.');
            }
          });
        }
      },
      {
        given: 'Element where not all children have a "name" attribute',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Commands>
                <Command name="domain-command" abstract="true">
                  <Arguments>
                    <ArgumentRef name="name"/>
                    <ArgumentRef name="header"/>
                    <ArgumentRef name="producer"/>
                    <ArgumentRef xname="director"/>
                  </Arguments>
                </Command>
              </Commands>
            </Cli>
          </Application>`,
        commandName: 'domain-command',
        verify: (commandsNode, commandNode) => {
          it('indexBy should: throw on missing "name"', () => {
            const argumentsNode = XHelpers.selectFirst('.//Arguments', commandsNode);

            if (argumentsNode) {
              expect(() => {
                Impl.buildElementWithSpec(argumentsNode, commandNode,
                  indexBySpecThrows, getTestOptionsThrows);
              }).to.throw();
            } else {
              assert.fail('Couldn\'t get Arguments node.');
            }
          });
        }
      }, // end of indexBy
      {
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
          it('groupBy should: create element whose descendants are grouped by "name"', () => {
            const argumentsNode = XHelpers.selectFirst('.//Arguments', commandsNode);

            if (argumentsNode) {
              const argumentsElement = Impl.buildElementWithSpec(argumentsNode, commandNode,
                groupBySpec, (el) => {
                  return {
                    id: 'name',
                    recurse: 'inherits',
                    discards: ['inherits', 'abstract'],
                    descendants: {
                      by: 'group',
                      attribute: 'name',
                      throwIfCollision: false,
                      throwIfMissing: false
                    }
                  };
                });
              const children = descendantsProp(argumentsElement);

              expect(children).to.be.an('object').that.has.all.keys(
                'name', 'header', 'producer', 'director');

              R.forEachObjIndexed((val, name) => {
                expect(val).to.be.an('array');
                expect(val).to.have.lengthOf(1);
                expect(R.head(val), `${name} key is missing one or more items (${JSON.stringify(val)})`).to.have.all.keys('_', 'name');
              })(children);
            } else {
              assert.fail('Couldn\'t get Arguments node.');
            }
          });
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
          it('groupBy should: create element whose descendants are not grouped', () => {
            const argumentsNode = XHelpers.selectFirst('.//Arguments', commandsNode);

            if (argumentsNode) {
              const argumentsElement = Impl.buildElementWithSpec(
                argumentsNode, commandNode, groupBySpec, getTestOptions);
              const children = descendantsProp(argumentsElement);

              expect(children).to.be.an('array');
              expect(children).to.have.lengthOf(4);

              R.forEachObjIndexed((child) => {
                expect(child).to.be.an('object');
                expect(child, `missing "_" property (${JSON.stringify(child)})`).to.have.own.property('_');
              })(children);
            } else {
              assert.fail('Couldn\'t get Arguments node.');
            }
          });
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
          it('groupBy should: create element whose descendants are not grouped', () => {
            const argumentsNode = XHelpers.selectFirst('.//Arguments', commandsNode);

            if (argumentsNode) {
              const argumentsElement = Impl.buildElementWithSpec(
                argumentsNode, commandNode, groupBySpec, getTestOptions);
              const children = descendantsProp(argumentsElement);

              expect(children).to.be.an('array');
              expect(R.keys(children)).to.have.lengthOf(4);

              R.forEachObjIndexed((child) => {
                expect(child).to.be.an('object');
                expect(child, `missing "_" property (${JSON.stringify(child)})`).to.have.own.property('_');
              })(children);
            } else {
              assert.fail('Couldn\'t get Arguments node.');
            }
          });
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
          it('groupBy should: create element whose descendants are grouped by "name"', () => {
            const argumentsNode = XHelpers.selectFirst('.//Arguments', commandsNode);

            if (argumentsNode) {
              const argumentsElement = Impl.buildElementWithSpec(
                argumentsNode, commandNode, groupBySpec, (el) => {
                  return {
                    id: 'name',
                    recurse: 'inherits',
                    discards: ['inherits', 'abstract'],
                    descendants: {
                      by: 'group',
                      attribute: 'name',
                      throwIfCollision: false,
                      throwIfMissing: false
                    }
                  };
                });
              const children = descendantsProp(argumentsElement);

              expect(children).to.be.an('object').that.has.all.keys(
                'name', 'header', 'producer', 'director');
              expect(R.keys(children)).to.have.lengthOf(4);

              R.forEachObjIndexed((val, name) => {
                expect(val, `value of ${name} is not an array`).to.be.an('array');
              })(children);

              expect(children['name']).to.have.lengthOf(1);
              expect(children['header']).to.have.lengthOf(1);
              expect(children['producer']).to.have.lengthOf(1);
              expect(children['director']).to.have.lengthOf(2);

              expect(R.whereEq({
                _: 'ArgumentRef',
                name: 'director',
                discriminator: 'A'
              })(children['director'][0])).to.be.true();

              expect(R.whereEq({
                _: 'ArgumentRef',
                name: 'director',
                discriminator: 'B'
              })(children['director'][1])).to.be.true();
            } else {
              assert.fail('Couldn\'t get Arguments node.');
            }
          });
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
          it('groupBy should: create element whose descendants are grouped by "name"', () => {
            const argumentsNode = XHelpers.selectFirst('.//Arguments', commandsNode);

            if (argumentsNode) {
              const argumentsElement = Impl.buildElementWithSpec(
                argumentsNode, commandNode, groupBySpec, (el) => {
                  return {
                    id: 'name',
                    recurse: 'inherits',
                    discards: ['inherits', 'abstract'],
                    descendants: {
                      by: 'group',
                      attribute: 'name',
                      throwIfCollision: false,
                      throwIfMissing: false
                    }
                  };
                });
              const children = descendantsProp(argumentsElement);

              expect(children).to.be.an('object').that.has.all.keys('director');
              expect(R.keys(children)).to.have.lengthOf(1);

              const director = children['director'];
              expect(director).to.be.an('array').to.have.lengthOf(4);

              director.forEach((d) => {
                expect(R.where({
                  '_': R.equals('ArgumentRef'),
                  'name': R.equals('director'),
                  'discriminator': R.includes(R.__, ['A', 'B', 'C', 'D'])
                })(d)).to.be.true();
              });
            } else {
              assert.fail('Couldn\'t get Arguments node.');
            }
          });
        }
      },
      {
        given: 'Element where not all children have a "name" attribute (missing)',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Commands>
                <Command name="domain-command" abstract="true">
                  <Arguments>
                    <ArgumentRef name="name"/>
                    <ArgumentRef name="header"/>
                    <ArgumentRef name="producer"/>
                    <ArgumentRef xname="director"/>
                  </Arguments>
                </Command>
              </Commands>
            </Cli>
          </Application>`,
        commandName: 'domain-command',
        verify: (commandsNode, commandNode) => {
          it('groupBy should: throw on missing "name"', () => {
            const argumentsNode = XHelpers.selectFirst('.//Arguments', commandsNode);

            const groupBySpecThrows = R.set(R.lensPath(['descendants', 'throwIfMissing']),
              true)(groupBySpec);

            if (argumentsNode) {
              expect(() => {
                Impl.buildElementWithSpec(argumentsNode, commandNode,
                  groupBySpecThrows, getTestOptionsThrows);
              }).to.throw();
            } else {
              assert.fail('Couldn\'t get Arguments node.');
            }
          });
        }
      }];

      tests.forEach((t) => {
        const document = parser.parseFromString(t.data);
        const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

        if (commandsNode) {
          const commandNode = XHelpers.selectFirst(`./Command[@name="${t.commandName}"]`,
            commandsNode);

          if (commandNode) {
            context(`given: ${t.given}`, () => {
              t.verify(commandsNode, t.commandName);
            });
          } else {
            assert.fail(`Couldn't get Command node named: "${t.commandName}"`);
          }
        } else {
          assert.fail('Couldn\'t get Commands node.');
        }
      });
    }); // index/group descendants by
  }); // converter:buildElement (descendants)
})();
