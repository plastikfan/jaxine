
/* eslint-disable no-useless-escape */

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

  describe('converter.impl:buildElement', () => {
    context('given command with no inheritance', () => {
      it('should: return a command object all local attributes', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Commands>
                <Command name="leaf" describe="this is a leaf command" type="native"/>
              </Commands>
            </Cli>
          </Application>`;

        const document = parser.parseFromString(data);
        const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

        if (commandsNode) {
          let leafCommandNode = XHelpers.selectElementNodeById('Command', 'name', 'leaf', commandsNode) || {};
          let command = Jaxine.buildElement(leafCommandNode, commandsNode, getTestOptions);

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

    context('given: Command with no inheritance', () => {
      it('should: return a command object all local attributes', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Commands>
                <Command name="base-command" abstract="true"/>
                <Command name="mid-command" inherits="base-command" type="native"/>
                <Command name="leaf" inherits="mid-command" describe="this is a leaf command"/>
              </Commands>
            </Cli>
          </Application>`;

        const document = parser.parseFromString(data);
        const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

        if (commandsNode) {
          let leafCommandNode = XHelpers.selectElementNodeById('Command', 'name', 'leaf', commandsNode) || {};
          let command = Jaxine.buildElement(leafCommandNode, commandsNode, getTestOptions);

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

    context('given: a command inherits from itself', () => {
      it('should: throw', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Commands>
                <Command name="leaf" describe="this is a leaf command" inherits="leaf"/>
              </Commands>
            </Cli>
          </Application>`;

        const document = parser.parseFromString(data);
        const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

        if (commandsNode) {
          let invalidCommandNode = XHelpers.selectElementNodeById('Command', 'name', 'leaf', commandsNode) || {};

          expect(() => {
            Jaxine.buildElement(invalidCommandNode, commandsNode, getTestOptions);
          }).to.throw(Error);
        } else {
          assert.fail('FAILURE! Couldn\'t get Commands node.');
        }
      });
    });

    context('given: Expression with no inheritance', () => {
      it('should: return an expression object all local attributes', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions>
              <Expression name="person's-name-expression" eg="Mick Mars">
                <Pattern><![CDATA[[a-zA-Z\s']+]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`;

        const document = parser.parseFromString(data);
        const expressionsNode = XHelpers.selectFirst('/Application/Expressions', document);

        if (expressionsNode) {
          let expressionNode = XHelpers.selectElementNodeById(
            'Expression', 'name', 'person\'s-name-expression', expressionsNode) || {};

          let element = Jaxine.buildElement(expressionNode, expressionsNode, (el) => {
            return {
              id: 'name',
              descendants: {
                by: 'index',
                throwIfCollision: false,
                throwIfMissing: false
              }
            };
          });

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals(`person's-name-expression`),
            'eg': R.equals('Mick Mars')
          })(element), element);

          expect(result).to.be.true(functify(element));
        } else {
          assert.fail('Couldn\'t get Expressions node.');
        }
      });
    });

    context('given: Source with no inheritance', () => {
      it('should: return a source object all local attributes', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Sources>
              <Source name="some-json-source" provider="json-provider">
                <Path fullpath="/path/to/json/file.txt"/>
              </Source>
            </Sources>
          </Application>`;

        const document = parser.parseFromString(data);
        const sourcesNode = XHelpers.selectFirst('/Application/Sources', document);

        if (sourcesNode) {
          let expressionNode = XHelpers.selectElementNodeById(
            'Source', 'name', 'some-json-source', sourcesNode) || {};

          let source = Jaxine.buildElement(expressionNode, sourcesNode, (el) => {
            return {
              id: 'name',
              descendants: {
                by: 'index',
                throwIfCollision: false,
                throwIfMissing: false
              }
            };
          });

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('some-json-source'),
            'provider': R.equals('json-provider')
          })(source), source);

          expect(result).to.be.true(functify(source));
        } else {
          assert.fail('Couldn\'t get Sources node.');
        }
      });
    });

    context('given: Argument with no inheritance', () => {
      it('should: return an argument object all local attributes', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Arguments>
                <Argument name="filesys" alias="fs" optional="true"
                  describe="The file system as defined in config as FileSystem">
                </Argument>
              </Arguments>
            </Cli>
          </Application>`;

        const document = parser.parseFromString(data);
        const argumentsNode = XHelpers.selectFirst('/Application/Cli/Arguments', document);

        if (argumentsNode) {
          let argumentNode = XHelpers.selectElementNodeById(
            'Argument', 'name', 'filesys', argumentsNode) || {};

          let source = Jaxine.buildElement(argumentNode, argumentsNode, (el) => {
            return {
              id: 'name',
              descendants: {
                by: 'index',
                throwIfCollision: false,
                throwIfMissing: false
              }
            };
          });

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('filesys'),
            'alias': R.equals('fs'),
            'optional': R.equals(true)
          })(source), source);

          expect(result).to.be.true(functify(source));
        } else {
          assert.fail('Couldn\'t get Arguments node.');
        }
      });
    });

    context('given: Tree with no inheritance', () => {
      it('should: return an tree object all local attributes', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <FileSystems>
              <FileSystem name="staging" default="true">
                <Trees>
                  <Tree root="/Volumes/Epsilon/Skipa" alias="skipa"/>
                </Trees>
              </FileSystem>
            </FileSystems>
          </Application>`;

        const document = parser.parseFromString(data);
        const treesNode = XHelpers.selectFirst('/Application/FileSystems/FileSystem[@name="staging"]/Trees', document);

        if (treesNode) {
          let treeNode = XHelpers.selectElementNodeById(
            'Tree', 'alias', 'skipa', treesNode) || {};

          let tree = Jaxine.buildElement(treeNode, treesNode, (el) => {
            return {
              id: 'alias',
              descendants: {
                by: 'index',
                throwIfCollision: false,
                throwIfMissing: false
              }
            };
          });

          let result = Helpers.logIfFailedStringify(R.where({
            'alias': R.equals('skipa'),
            'root': R.equals('/Volumes/Epsilon/Skipa')
          })(tree), tree);

          expect(result).to.be.true(functify(tree));
        } else {
          assert.fail('Couldn\'t get Trees node.');
        }
      });
    });

    context('Additional inheritance Command tests', () => {
      context('given: command with single line of inheritance (3 commands, no args)', () => {
        it('should: return a command object all inherited attributes', () => {
          const data = `<?xml version="1.0"?>
            <Application name="pez">
              <Cli>
                <Commands>
                  <Command name="base-command" abstract="true"/>
                  <Command name="mid-command" inherits="base-command" type="native"/>
                  <Command name="leaf" inherits="mid-command" describe="this is a leaf command"/>
                </Commands>
              </Cli>
            </Application>`;

          const document = parser.parseFromString(data);
          const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

          if (commandsNode) {
            let leafCommandNode = XHelpers.selectElementNodeById('Command', 'name', 'leaf', commandsNode) || {};
            let command = Jaxine.buildElement(leafCommandNode, commandsNode, getTestOptions);

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

      context('given: command with single line of inheritance (3 commands, no args)', () => {
        it('should: return a command object all inherited attributes', () => {
          const data = `<?xml version="1.0"?>
            <Application name="pez">
              <Cli>
                <Commands>
                  <Command name="base-command" abstract="true"/>
                  <Command name="mid-command" inherits="base-command" type="native"/>
                  <Command name="leaf" inherits="mid-command" describe="this is a leaf command"/>
                </Commands>
              </Cli>
            </Application>`;

          const document = parser.parseFromString(data);
          const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

          if (commandsNode) {
            let leafCommandNode = XHelpers.selectElementNodeById('Command', 'name', 'leaf', commandsNode) || {};
            let command = Jaxine.buildElement(leafCommandNode, commandsNode, getTestOptions);

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

      context('given: command with single line of inheritance (3 commands, no args)', () => {
        it('should: return a command object all inherited attributes where mid command overrides base', () => {
          const data = `<?xml version="1.0"?>
            <Application name="pez">
              <Cli>
                <Commands>
                  <Command name="base-command" abstract="true" filter="alpha"/>
                  <Command name="mid-command" inherits="base-command" type="native" filter="beta"/>
                  <Command name="leaf" inherits="mid-command" describe="this is a leaf command"/>
                </Commands>
              </Cli>
            </Application>`;

          const document = parser.parseFromString(data);
          const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

          if (commandsNode) {
            let leafCommandNode = XHelpers.selectElementNodeById('Command', 'name', 'leaf', commandsNode) || {};
            let command = Jaxine.buildElement(leafCommandNode, commandsNode, getTestOptions);

            let result = Helpers.logIfFailedStringify(R.where({
              'name': R.equals('leaf'),
              'describe': R.equals('this is a leaf command'),
              'type': R.equals('native'),
              'filter': R.equals('beta')
            })(command), command);

            expect(result).to.be.true(functify(command));
          } else {
            assert.fail('Couldn\'t get Commands node.');
          }
        });
      });
    });

    context('given: command with single line of inheritance (3 commands, no args)', () => {
      it('should: return a command object all inherited attributes where leaf command overrides base', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Commands>
                <Command name="base-command" abstract="true" filter="alpha"/>
                <Command name="mid-command" inherits="base-command" type="native"/>
                <Command name="leaf" inherits="mid-command" describe="this is a leaf command" filter="beta"/>
              </Commands>
            </Cli>
          </Application>`;

        const document = parser.parseFromString(data);
        const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

        if (commandsNode) {
          let leafCommandNode = XHelpers.selectElementNodeById('Command', 'name', 'leaf', commandsNode) || {};
          let command = Jaxine.buildElement(leafCommandNode, commandsNode, getTestOptions);

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('leaf'),
            'describe': R.equals('this is a leaf command'),
            'type': R.equals('native'),
            'filter': R.equals('beta')
          })(command), command);

          expect(result).to.be.true(functify(command));
        } else {
          assert.fail('Couldn\'t get Commands node.');
        }
      });
    });

    context('given: command with 3-way multi inheritance (3 commands, no args)', () => {
      it('should: return a command object all inherited attributes from 3 base commands', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Commands>
                <Command name="alpha-command" abstract="true" filter="alpha"/>
                <Command name="beta-command" type="native"/>
                <Command name="gamma-command" theme="concept"/>
                <Command name="leaf" inherits="alpha-command,beta-command,gamma-command"
                  describe="this is a leaf command" album="powerslave"/>
              </Commands>
            </Cli>
          </Application>`;

        const document = parser.parseFromString(data);
        const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

        if (commandsNode) {
          let leafCommandNode = XHelpers.selectElementNodeById('Command', 'name', 'leaf', commandsNode) || {};
          let command = Jaxine.buildElement(leafCommandNode, commandsNode, getTestOptions);

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('leaf'),
            'describe': R.equals('this is a leaf command'),
            'album': R.equals('powerslave'),
            'filter': R.equals('alpha'),
            'type': R.equals('native'),
            'theme': R.equals('concept')
          })(command), command);

          expect(result).to.be.true(functify(command));
        } else {
          assert.fail('Couldn\'t get Commands node.');
        }
      });

      it('should: return a command object all inherited and overridden attributes from 3 base commands', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Commands>
                <Command name="alpha-command" abstract="true" filter="alpha-filter"/>
                <Command name="beta-command" filter="beta-filter"/>
                <Command name="gamma-command" filter="gamma-filter"/>
                <Command name="leaf" inherits="alpha-command,beta-command,gamma-command"
                  describe="this is a leaf command" filter="leaf-filter"/>
              </Commands>
            </Cli>
          </Application>`;

        const document = parser.parseFromString(data);
        const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

        if (commandsNode) {
          let leafCommandNode = XHelpers.selectElementNodeById('Command', 'name', 'leaf', commandsNode) || {};
          let command = Jaxine.buildElement(leafCommandNode, commandsNode, getTestOptions);

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('leaf'),
            'describe': R.equals('this is a leaf command'),
            'filter': R.equals('leaf-filter')
          })(command), command);

          expect(result).to.be.true(functify(command));
        } else {
          assert.fail('Couldn\'t get Commands node.');
        }
      });
    });

    context('given: command with dual inheritance (2+1 commands, no args)', () => {
      it('should: return a command object all inherited attributes from 2 base commands', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Commands>
                <Command name="alpha-command" abstract="true" filter="alpha"/>
                <Command name="beta-command" inherits="alpha-command" type="native"/>
                <Command name="gamma-command" theme="concept"/>
                <Command name="leaf" inherits="beta-command,gamma-command"
                  describe="this is a leaf command" album="powerslave"/>
              </Commands>
            </Cli>
          </Application>`;

        const document = parser.parseFromString(data);
        const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

        if (commandsNode) {
          let leafCommandNode = XHelpers.selectElementNodeById('Command', 'name', 'leaf', commandsNode) || {};
          let command = Jaxine.buildElement(leafCommandNode, commandsNode, getTestOptions);

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('leaf'),
            'describe': R.equals('this is a leaf command'),
            'album': R.equals('powerslave'),
            'filter': R.equals('alpha'),
            'type': R.equals('native'),
            'theme': R.equals('concept')
          })(command), command);

          expect(result).to.be.true(functify(command));
        } else {
          assert.fail('Couldn\'t get Commands node.');
        }
      });
    });

    context('given: command with dual inheritance (2+1 commands, no args)', () => {
      it('return a command object all inherited attributes from 2 base commands', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Commands>
                <Command name="alpha-command" abstract="true" filter="alpha"/>
                <Command name="beta-command" inherits="alpha-command" type="native"/>
                <Command name="gamma-command" theme="concept"/>
                <Command name="leaf" inherits="beta-command,gamma-command"
                  describe="this is a leaf command" album="powerslave"/>
              </Commands>
            </Cli>
          </Application>`;

        const document = parser.parseFromString(data);
        const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

        if (commandsNode) {
          let leafCommandNode = XHelpers.selectElementNodeById('Command', 'name', 'leaf', commandsNode) || {};
          let command = Jaxine.buildElement(leafCommandNode, commandsNode, getTestOptions);

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('leaf'),
            'describe': R.equals('this is a leaf command'),
            'album': R.equals('powerslave'),
            'filter': R.equals('alpha'),
            'type': R.equals('native'),
            'theme': R.equals('concept')
          })(command), command);

          expect(result).to.be.true(functify(command));
        } else {
          assert.fail('Couldn\'t get Commands node.');
        }
      });
    });

    context('given: command with dual inheritance (1+1 commands, no args)', () => {
      it('should: return a command object all inherited attributes where right-most command take precedence', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Commands>
                <Command name="alpha-command" filter="alpha-filter" mode="auto"/>
                <Command name="beta-command" filter="beta-filter"/>
                <Command name="leaf" inherits="alpha-command,beta-command"
                  describe="this is a leaf command"/>
              </Commands>
            </Cli>
          </Application>`;

        const document = parser.parseFromString(data);
        const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

        if (commandsNode) {
          let leafCommandNode = XHelpers.selectElementNodeById('Command', 'name', 'leaf', commandsNode) || {};
          let command = Jaxine.buildElement(leafCommandNode, commandsNode, getTestOptions);

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('leaf'),
            'describe': R.equals('this is a leaf command'),
            'filter': R.equals('beta-filter'),
            'mode': R.equals('auto')
          })(command), command);

          expect(result).to.be.true(functify(command));
        } else {
          assert.fail('Couldn\'t get Commands node.');
        }
      });
    });

    context('given: circular command references detected', () => {
      it('should: throw', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Commands>
                <Command name="alpha-command" inherits="beta-command"/>
                <Command name="beta-command" inherits="alpha-command"/>
                <Command name="leaf" inherits="beta-command"
                  describe="this is a leaf command"/>
              </Commands>
            </Cli>
          </Application>`;

        const document = parser.parseFromString(data);
        const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

        if (commandsNode) {
          let leafCommandNode = XHelpers.selectElementNodeById('Command', 'name', 'leaf', commandsNode) || {};

          expect(() => {
            Jaxine.buildElement(leafCommandNode, commandsNode, getTestOptions);
          }).to.throw(Error);
        } else {
          assert.fail('FAILURE! Couldn\'t get Commands node.');
        }
      });
    });

    context('given: command inherits from itself', () => {
      it('should: throw', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Commands>
                <Command name="leaf" inherits="leaf"
                  describe="this is a leaf command"/>
              </Commands>
            </Cli>
          </Application>`;

        const document = parser.parseFromString(data);
        const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

        if (commandsNode) {
          let leafCommandNode = XHelpers.selectElementNodeById('Command', 'name', 'leaf', commandsNode) || {};

          expect(() => {
            Jaxine.buildElement(leafCommandNode, commandsNode, getTestOptions);
          }).to.throw(Error);
        } else {
          assert.fail('FAILURE! Couldn\'t get Commands node.');
        }
      });
    });

    context('given: command with single inheritance and local & inherited arguments and groups', () => {
      const data = `<?xml version="1.0"?>
        <Application name="pez">
          <Cli>
            <Commands>
              <Command name="duo-command" abstract="true">
                <Arguments>
                  <ArgumentRef name="from"/>
                  <ArgumentRef name="to"/>
                </Arguments>
                <ArgumentGroups>
                  <Implies>
                    <ArgumentRef name="from"/>
                    <ArgumentRef name="to"/>
                  </Implies>
                </ArgumentGroups>
              </Command>
              <Command name="test" describe="Test regular expression definitions" inherits="duo-command">
                <Arguments>
                  <ArgumentRef name="config"/>
                  <ArgumentRef name="expr"/>
                  <ArgumentRef name="input"/>
                </Arguments>
                <ArgumentGroups>
                  <Implies>
                    <ArgumentRef name="input"/>
                    <ArgumentRef name="expr"/>
                    <ArgumentRef name="input"/>
                  </Implies>
                </ArgumentGroups>
              </Command>
            </Commands>
          </Cli>
        </Application>`;

      const document = parser.parseFromString(data);
      const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

      if (commandsNode) {
        let testCommandNode = XHelpers.selectElementNodeById('Command', 'name', 'test', commandsNode) || {};

        let command = Jaxine.buildElement(testCommandNode, commandsNode, getTestOptions);

        if (command) {
          it('should: return a command object with all children attached', () => {
            let result = Helpers.logIfFailedStringify(R.where({
              'name': R.equals('test'),
              'describe': R.equals('Test regular expression definitions'),
              '_': R.equals('Command'),
              '_children': R.is(Array)
            })(command), command);

            expect(result).to.be.true(functify(command));
          });

          it('should: return a command object where no of children is 4', () => {
            let children = command['_children'];

            expect(children.length).to.equal(4);
          });
        }
      } else {
        assert.fail('Couldn\'t get Commands node.');
      }
    });

    context('given: command with single inheritance chain and local & inherited arguments', () => {
      const data = `<?xml version="1.0"?>
        <Application name="pez">
          <Cli>
            <Commands>
              <Command name="uni-command" abstract="true">
                <Arguments>
                  <ArgumentRef name="path"/>
                  <ArgumentRef name="filesys"/>
                  <ArgumentRef name="tree"/>
                </Arguments>
              </Command>
              <Command name="duo-command" abstract="true" inherits="uni-command">
                <Arguments>
                  <ArgumentRef name="from"/>
                  <ArgumentRef name="to"/>
                </Arguments>
              </Command>
              <Command name="test" describe="Test regular expression definitions" inherits="duo-command">
                <Arguments>
                  <ArgumentRef name="config"/>
                  <ArgumentRef name="expr"/>
                  <ArgumentRef name="input"/>
                </Arguments>
              </Command>
            </Commands>
          </Cli>
        </Application>`;

      const document = parser.parseFromString(data);
      const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

      if (commandsNode) {
        let testCommandNode = XHelpers.selectElementNodeById('Command', 'name', 'test', commandsNode) || {};

        let command = Jaxine.buildElement(testCommandNode, commandsNode, getTestOptions);

        if (command) {
          it('should: return a command object with all children attached', () => {
            let result = Helpers.logIfFailedStringify(R.where({
              'name': R.equals('test'),
              'describe': R.equals('Test regular expression definitions'),
              '_': R.equals('Command'),
              '_children': R.is(Array)
            })(command), command);

            expect(result).to.be.true(functify(command));
          });

          it('should: return a command object where no of children is 3', () => {
            let children = command['_children'];

            expect(children.length).to.equal(3);
          });
        }
      } else {
        assert.fail('Couldn\'t get Commands node.');
      }
    });

    context('given: command with dual inheritance and local & inherited arguments', () => {
      const data = `<?xml version="1.0"?>
        <Application name="pez">
          <Cli>
            <Commands>
              <Command name="uni-command" abstract="true">
                <Arguments>
                  <ArgumentRef name="path"/>
                  <ArgumentRef name="filesys"/>
                  <ArgumentRef name="tree"/>
                </Arguments>
              </Command>
              <Command name="duo-command" abstract="true">
                <Arguments>
                  <ArgumentRef name="from"/>
                  <ArgumentRef name="to"/>
                </Arguments>
              </Command>
              <Command name="test" describe="Test regular expression definitions" inherits="duo-command,uni-command">
                <Arguments>
                  <ArgumentRef name="config"/>
                  <ArgumentRef name="expr"/>
                  <ArgumentRef name="input"/>
                </Arguments>
              </Command>
            </Commands>
          </Cli>
        </Application>`;

      const document = parser.parseFromString(data);
      const commandsNode = XHelpers.selectFirst('/Application/Cli/Commands', document);

      if (commandsNode) {
        let testCommandNode = XHelpers.selectElementNodeById('Command', 'name', 'test', commandsNode) || {};

        let command = Jaxine.buildElement(testCommandNode, commandsNode, getTestOptions);

        if (command) {
          it('should: return a command object with all children attached', () => {
            let result = Helpers.logIfFailedStringify(R.where({
              'name': R.equals('test'),
              'describe': R.equals('Test regular expression definitions'),
              '_': R.equals('Command'),
              '_children': R.is(Array)
            })(command), command);

            expect(result).to.be.true(functify(command));
          });

          it('return a command object with all 3 children attached', () => {
            let children = command['_children'];

            expect(children.length).to.equal(3);
          });
        }
      } else {
        assert.fail('Couldn\'t get Commands node.');
      }
    });

    context('given: an Expression with CDATA section', () => {
      it('should: return an expression object with text stored as a child.', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="content-expressions">
              <Expression name="meta-prefix-expression">
                <Pattern eg="_"><![CDATA[SOME-TEXT]]></Pattern>
                <Pattern eg="cover" csv="meta-csv"/>
                <Pattern eg=".">MORE-TEXT-NO-CDATA</Pattern>
                <Pattern eg="media."><![CDATA[(media.)?]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`;

        const document = parser.parseFromString(data);
        const expressionsNode = XHelpers.selectFirst(
          '/Application/Expressions[@name="content-expressions"]', document);

        if (expressionsNode) {
          let expressionNode = XHelpers.selectElementNodeById(
            'Expression', 'name', 'meta-prefix-expression', expressionsNode) || {};
          let command = Jaxine.buildElement(expressionNode, expressionsNode, getTestOptions);

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('meta-prefix-expression')
          })(command), command);

          expect(result).to.be.true(functify(command));
        } else {
          assert.fail('Couldn\'t get Expressions node.');
        }
      });
    });
  }); // converter:buildElement

  describe('converter.impl:composeText', () => {
    const defaultSpec = {
      labels: {
        element: '_',
        descendants: '_children',
        text: '_text'
      }
    };

    context('given: a Pattern element with a single text child', () => {
      it('should: return the trimmed text.', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="content-expressions">
              <Expression name="meta-prefix-expression">
                <Pattern eg="TEXT">   SOME-RAW-TEXT   </Pattern>
              </Expression>
            </Expressions>
          </Application>`;

        const document = parser.parseFromString(data);
        const patternNode = XHelpers.selectFirst(
          '/Application/Expressions[@name="content-expressions"]/Expression/Pattern[@eg="TEXT"]', document);

        if (patternNode) {
          let result = Impl.composeText(defaultSpec, patternNode);

          expect(result).to.equal('SOME-RAW-TEXT');
        } else {
          assert.fail('Couldn\'t get Pattern node.');
        }
      });
    });

    context('given: a Pattern element with a single CDATA section', () => {
      it('should: return CDATA text.', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="content-expressions">
              <Expression name="meta-prefix-expression">
                <Pattern eg="TEXT">   <![CDATA[   .SOME-CDATA-TEXT   ]]>   </Pattern>
              </Expression>
            </Expressions>
          </Application>`;

        const document = parser.parseFromString(data);
        const patternNode = XHelpers.selectFirst(
          '/Application/Expressions[@name="content-expressions"]/Expression/Pattern[@eg="TEXT"]', document);

        if (patternNode) {
          let result = Impl.composeText(defaultSpec, patternNode);

          expect(result).to.equal('.SOME-CDATA-TEXT');
        } else {
          assert.fail('Couldn\'t get Pattern node.');
        }
      });
    });

    context('given: a Pattern element with a single text child followed by single CDATA section', () => {
      it('should: return raw text child concatenated with CDATA text.', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="content-expressions">
              <Expression name="meta-prefix-expression">
                <Pattern eg="TEXT"> SOME-RAW-TEXT <![CDATA[ .SOME-CDATA-TEXT ]]> </Pattern>
              </Expression>
            </Expressions>
          </Application>`;

        const document = parser.parseFromString(data);
        const patternNode = XHelpers.selectFirst(
          '/Application/Expressions[@name="content-expressions"]/Expression/Pattern[@eg="TEXT"]', document);

        if (patternNode) {
          let result = Impl.composeText(defaultSpec, patternNode);

          expect(result).to.equal('SOME-RAW-TEXT.SOME-CDATA-TEXT');
        } else {
          assert.fail('Couldn\'t get Pattern node.');
        }
      });
    });

    context('given: a Pattern element with multiple CDATA sections and raw text sections', () => {
      it('should: return raw text child concatenated with CDATA text.', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="content-expressions">
              <Expression name="meta-prefix-expression">
                <Pattern eg="TEXT"> SOME-RAW-TEXT <![CDATA[ .SOME-CDATA-TEXT ]]> <![CDATA[ .SOME-MORE-CDATA-TEXT ]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`;

        const document = parser.parseFromString(data);
        const patternNode = XHelpers.selectFirst(
          '/Application/Expressions[@name="content-expressions"]/Expression/Pattern[@eg="TEXT"]', document);

        if (patternNode) {
          let result = Impl.composeText(defaultSpec, patternNode);

          expect(result).to.equal('SOME-RAW-TEXT.SOME-CDATA-TEXT.SOME-MORE-CDATA-TEXT');
        } else {
          assert.fail('Couldn\'t get Pattern node.');
        }
      });
    });

    context('given: a Pattern element with single CDATA section and child element', () => {
      it('should: return the CDATA text.', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="content-expressions">
              <Expression name="meta-prefix-expression">
                <Pattern eg="TEXT"><![CDATA[ .SOME-CDATA-TEXT ]]>
                  </Dummy>
                </Pattern>
              </Expression>
            </Expressions>
          </Application>`;

        const document = parser.parseFromString(data);
        const patternNode = XHelpers.selectFirst(
          '/Application/Expressions[@name="content-expressions"]/Expression/Pattern[@eg="TEXT"]', document);

        if (patternNode) {
          let result = Impl.composeText(defaultSpec, patternNode);

          expect(result).to.equal('.SOME-CDATA-TEXT');
        } else {
          assert.fail('Couldn\'t get Pattern node.');
        }
      });
    });
  }); // converter:composeText

  describe('converter.impl:validateSpec', () => {
    context('given: valid pre-defined specs', () => {
      const specs = require('../lib/converter').specs;
      Object.getOwnPropertyNames(specs).forEach((specName) => {
        const spec = specs[specName];

        it(`"${specName}" spec validation, should not throw`, () => {
          expect(Impl.validateSpec(spec)).to.be.true();
        });
      });
    });

    context('Invalid spec', () => {
      const tests = [{
        given: 'spec with missing "labels"',
        spec: {
        }
      },
      {
        given: 'spec with "element" missing from "labels',
        spec: {
          labels: {
            descendants: '_children',
            text: '_text'
          }
        }
      },
      {
        given: 'spec with "descendants" missing from "labels',
        spec: {
          labels: {
            element: '_',
            text: '_text'
          }
        }
      },
      {
        given: 'spec with "text" missing from "labels',
        spec: {
          labels: {
            element: '_',
            descendants: '_children'
          }
        }
      }];

      tests.forEach((t) => {
        context(`given: ${t.given}`, () => {
          it('should: throw', () => {
            expect(() => {
              Impl.validateSpec(t.spec);
            }).to.throw();
          });
        });
      });
    });
  }); // converter.impl:validateSpec

  describe('converter.impl:validateOptions', () => {
    context('Invalid options', () => {
      const tests = [{
        given: 'options with "descendants" and invalid "by"',
        options: {
          descendants: {
            by: 'RUBBISH',
            attribute: 'name'
          }
        }
      },
      {
        given: 'options with "descendants" and missing "descendants.attribute"',
        options: {
          descendants: {
            by: 'index'
          }
        }
      }, {
        given: 'options with invalid "throwIfCollision"',
        options: {
          descendants: {
            by: 'index',
            attribute: 'name',
            throwIfCollision: 'blah'
          }
        }
      }, {
        given: 'options with "throwIfCollision" enabled and descendants.by="group"',
        options: {
          descendants: {
            by: 'group',
            attribute: 'name',
            throwIfCollision: true
          }
        }
      }, {
        given: 'options with invalid "throwIfMissing"',
        options: {
          descendants: {
            by: 'index',
            attribute: 'name',
            throwIfMissing: 'blah'
          }
        }
      }];

      tests.forEach((t) => {
        context(`given: ${t.given}`, () => {
          it('should: throw', () => {
            expect(() => {
              Impl.validateOptions(t.options);
            }).to.throw();
          });
        });
      });
    });
  }); // converter.impl:validateOptions

  describe('converter.impl.buildLocalAttributes', () => {
    const spec = Object.freeze({
      labels: {
        element: '_',
        descendants: '_children',
        text: '_text',
        attributes: '_attributes'
      },
      trim: true
    });

    context('given: a spec with "attributes" label set', () => {
      it('should: populate attributes into array', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Directory name="archive"
              field="archive-location"
              date-modified="23 jun 2016"
              tags="front,back"
              category="hi-res"
              format="flac">
            </Directory>
          </Application>`;

        const document = parser.parseFromString(data);
        const applicationNode = XHelpers.selectFirst('/Application', document);

        if (applicationNode) {
          const directoryNode = XHelpers.selectElementNodeById(
            'Directory', 'name', 'archive', applicationNode) || {};
          const directory = Jaxine.buildElementWithSpec(directoryNode, applicationNode,
            spec, getTestOptions);

          expect(R.has('_attributes')(directory));
          const attributes = R.prop('_attributes')(directory);
          const attributeKeys = R.reduce((acc, val) => {
            return R.concat(acc, R.keys(val));
          }, [])(attributes);

          expect(R.all(at => R.includes(at, attributeKeys))(
            ['name', 'field', 'date-modified', 'tags', 'category', 'format'])).to.be.true();
        } else {
          assert.fail('Couldn\'t get Application node.');
        }
      });
    });
  });

  const testSpec = Object.freeze({
    name: 'test-spec-with-attributes',
    labels: {
      element: '_',
      descendants: '_children',
      text: '_text'
    },
    coercion: {
      attributes: {
        trim: true,
        matchers: {
          primitives: ['number', 'boolean'],
          collection: {
            delim: ',',
            open: '!<type>[',
            close: ']',
            assoc: {
              delim: '=',
              keyType: 'string',
              valueType: 'string'
            }
          },
          date: {
            format: 'YYYY-MM-DD'
          },
          symbol: {
            prefix: '$',
            global: true
          },
          string: true
        }
      }
    }
  });

  describe('convert.impl for "attributes" context [transforms]', () => {
    const tests = [
      // ['number]
      {
        given: 'spec with "attributes/matchers/primitives" = number',
        context: 'attributes',
        spec: () => {
          return R.set(R.lensPath(['coercion', 'attributes', 'matchers', 'primitives']),
            ['number'])(testSpec);
        },
        valueType: 'number',
        raw: 42,
        expected: 42
      },
      // ['boolean']
      {
        given: 'spec with "attributes/matchers/primitives" = boolean, value=true',
        context: 'attributes',
        spec: () => {
          return R.set(R.lensPath(['coercion', 'attributes', 'matchers', 'primitives']),
            ['boolean'])(testSpec);
        },
        valueType: 'boolean',
        raw: true,
        expected: true
      },
      {
        given: 'spec with "attributes/matchers/primitives" = boolean, value=false',
        context: 'attributes',
        spec: () => {
          return R.set(R.lensPath(['coercion', 'attributes', 'matchers', 'primitives']),
            ['boolean'])(testSpec);
        },
        valueType: 'boolean',
        raw: false,
        expected: false
      },
      {
        given: 'spec with "attributes/matchers/primitives" = boolean, value(string)="true"',
        context: 'attributes',
        spec: () => {
          return R.set(R.lensPath(['coercion', 'attributes', 'matchers', 'primitives']),
            ['boolean'])(testSpec);
        },
        valueType: 'boolean',
        raw: 'true',
        expected: true
      },
      {
        given: 'spec with "attributes/matchers/primitives" = boolean, value(string)="false"',
        context: 'attributes',
        spec: () => {
          return R.set(R.lensPath(['coercion', 'attributes', 'matchers', 'primitives']),
            ['boolean'])(testSpec);
        },
        valueType: 'boolean',
        raw: 'false',
        expected: false
      },
      // ['string']
      {
        given: 'spec with "attributes/matchers" = string(true)',
        context: 'attributes',
        spec: () => {
          return R.set(R.lensPath(['coercion', 'attributes', 'matchers']), {
            string: true
          })(testSpec);
        },
        valueType: 'string',
        raw: 'foo',
        expected: 'foo'
      },
      {
        given: 'spec without a final string matcher and unhandled string value',
        context: 'attributes',
        spec: () => {
          return R.set(R.lensPath(['coercion', 'attributes', 'matchers']), {
            primitives: ['number', 'boolean'],
            date: {
              format: 'YYYY-MM-DD'
            }
          })(testSpec);
        },
        valueType: 'string',
        raw: 'foo',
        expected: 'foo'
      }
    ];

    tests.forEach((t) => {
      context(`given: ${t.given}`, () => {
        it(`should: coerce "${t.valueType}" value ok`, () => {
          try {
            const result = Impl.getMatcher(t.valueType)(t.raw, t.context, t.spec());
            expect(result.succeeded).to.be.true(`succeeded RESULT: ${result.succeeded}`);
            expect(result.value).to.equal(t.expected);
          } catch (error) {
            assert.fail(`transform function for type: "${t.valueType}" failed. (${error})`);
          }
        });
      });
    });

    context('given: spec with "attributes/matchers/primitives" = date', () => {
      it('should: coerce "date" value ok:', () => {
        try {
          const dateValue = '2016-06-23';
          const result = Impl.getMatcher('date')(dateValue, 'attributes', testSpec);
          expect(result.succeeded).to.be.true(`succeeded RESULT: ${result.succeeded}`);
          expect(result.value.format('YYYY-MM-DD')).to.equal('2016-06-23');
        } catch (error) {
          assert.fail(`transform function for type: "date" failed. (${error})`);
        }
      });
    });

    context('given: spec with "attributes/matchers/primitives" = symbol', () => {
      it('should coerce "symbol" value ok:', () => {
        try {
          const symbolValue = '$excalibur';
          const symbolExpected = Symbol(symbolValue);
          const result = Impl.getMatcher('symbol')(symbolValue, 'attributes', testSpec);
          expect(result.succeeded).to.be.true(`succeeded RESULT: ${result.succeeded}`);
          expect(R.is(Symbol)(result.value)).to.be.true();
          expect(result.value.toString()).to.equal(symbolExpected.toString());
        } catch (error) {
          assert.fail(`transform function for type: "symbol" failed. (${error})`);
        }
      });
    });

    context('given: spec with "attributes/matchers" = string(false)', () => {
      it('should: throw', () => {
        try {
          const spec = R.set(R.lensPath(['coercion', 'attributes', 'matchers']), {
            string: false
          })(testSpec);

          expect(() => {
            Impl.getMatcher('string')('foo', 'attributes', spec);
          }).to.throw();
        } catch (error) {
          assert.fail(`transform function for type: "string" failed. (${error})`);
        }
      });
    });
  }); // convert.impl [transforms]

  describe('convert.impl for "attributes" context [transformCollection]', () => {
    const transformCollection = Impl.getMatcher('collection');
    context(`given: a compound value`, () => {
      // []
      it(`transformCollection (using default spec) should: coerce as a single item array`, () => {
        const result = transformCollection('!<[]>[foo]', 'attributes', testSpec);

        expect(result.succeeded).to.be.true(functify(result));
        expect(result.value).to.deep.equal(['foo'], functify(result));
      });

      it(`transformCollection (using default spec) should: coerce as a multiple item string array`, () => {
        const result = transformCollection('!<[]>[foo,bar,baz]', 'attributes', testSpec);

        expect(result.succeeded).to.be.true(functify(result));
        expect(result.value).to.deep.equal(['foo', 'bar', 'baz'], functify(result));
      });

      it(`transformCollection (using default spec) should: coerce as a multiple item numeric array`, () => {
        const result = transformCollection('!<[]>[1,2,3,4]', 'attributes', testSpec);

        expect(result.succeeded).to.be.true(functify(result));
        expect(result.value).to.deep.equal([1, 2, 3, 4], functify(result));
      });

      it(`transformCollection (using default spec) should: coerce as a multiple item boolean array`, () => {
        const result = transformCollection('!<[]>[true,false,true,false]', 'attributes', testSpec);

        expect(result.succeeded).to.be.true(functify(result));
        expect(result.value).to.deep.equal([true, false, true, false], functify(result));
      });

      it(`transformCollection (using default spec) should: coerce as a multiple item mix-type array`, () => {
        const result = transformCollection('!<[]>[one,42,true,foo]', 'attributes', testSpec);

        expect(result.succeeded).to.be.true(functify(result));
        expect(result.value).to.deep.equal(['one', 42, true, 'foo'], functify(result));
      });
      // [TypedArrays]
      it(`transformCollection (using default spec) should: coerce as a multiple item Int8Array array`, () => {
        const spec = R.set(
          R.lensPath(['coercion', 'attributes', 'matchers', 'collection', 'open']),
          '!<type>['
        )(testSpec);

        const result = transformCollection('!<Int8Array>[1,2,3,4]', 'attributes', spec);

        expect(result.succeeded).to.be.true(functify(result));
        expect(result.value).to.deep.equal(Int8Array.from([1, 2, 3, 4]), functify(result));
      });

      it(`transformCollection (using default spec) should: coerce as a multiple item Uint8Array array`, () => {
        const spec = R.set(
          R.lensPath(['coercion', 'attributes', 'matchers', 'collection', 'open']),
          '!<type>['
        )(testSpec);

        const result = transformCollection('!<Uint8Array>[1,2,3,4]', 'attributes', spec);

        expect(result.succeeded).to.be.true(functify(result));
        expect(result.value).to.deep.equal(Uint8Array.from([1, 2, 3, 4]), functify(result));
      });
      // [Set]
      it(`transformCollection (using default spec) should: coerce as a multiple item Set`, () => {
        const spec = R.set(
          R.lensPath(['coercion', 'attributes', 'matchers', 'collection', 'open']),
          '!<type>['
        )(testSpec);

        const result = transformCollection('!<Set>[1,2,3,4]', 'attributes', spec);
        const expectedSet = new Set([1, 2, 3, 4]);

        expect(result.succeeded).to.be.true(functify(result));
        expect(result.value.size).to.be.equal(expectedSet.size);
      });
      // [Map]
      it(`transformCollection (using default spec) should: coerce as a single item map`, () => {
        const spec = R.set(
          R.lensPath(['coercion', 'attributes', 'matchers', 'collection', 'assoc']),
          {
            delim: '=',
            keyType: 'string',
            valueType: 'string'
          }
        )(testSpec);

        const result = transformCollection('!<Map>[foo=bar]', 'attributes', spec);

        expect(result.succeeded).to.be.true(functify(result));
        expect(result.value.size).to.equal(1, functify(result));
        expect(result.value.get('foo')).to.equal('bar', functify(result));
      });

      it(`transformCollection (using default spec) should: coerce as a multiple item map`, () => {
        const spec = R.set(
          R.lensPath(['coercion', 'attributes', 'matchers', 'collection', 'assoc']),
          {
            delim: '=',
            keyType: 'string',
            valueType: 'string'
          }
        )(testSpec);

        const result = transformCollection('!<Map>[a=one,b=two,c=three]', 'attributes', spec);

        expect(result.succeeded).to.be.true(functify(result));
        expect(result.value.size).to.equal(3, functify(result));
        expect(result.value.get('a')).to.equal('one', functify(result));
      });

      it(`transformCollection (using default spec) should: coerce as a multiple item Object`, () => {
        const spec = R.set(
          R.lensPath(['coercion', 'attributes', 'matchers', 'collection', 'assoc']),
          {
            delim: '=',
            keyType: 'string',
            valueType: 'string'
          })(testSpec);

        const result = transformCollection('!<Object>[a=one,b=two,c=three]', 'attributes', spec);

        expect(result.succeeded).to.be.true(functify(result));
        expect(R.keys(result.value).length).to.equal(3, functify(result));
        expect(result.value['a']).to.equal('one', functify(result));
      });

      it(`transformCollection (using default spec) should: coerce as a multiple item Object and numeric keys`, () => {
        const spec = R.set(
          R.lensPath(['coercion', 'attributes', 'matchers', 'collection', 'assoc']),
          {
            delim: '=',
            keyType: 'number',
            valueType: 'string'
          })(testSpec);

        const result = transformCollection('!<Object>[1=one,2=two,3=three]', 'attributes', spec);

        expect(result.succeeded).to.be.true(functify(result));
        expect(R.keys(result.value).length).to.equal(3, functify(result));
        expect(result.value[1]).to.equal('one', functify(result));
      });

      it(`transformCollection (using default spec) should: coerce as a multiple item Object and numeric keys and values`, () => {
        const spec = R.set(
          R.lensPath(['coercion', 'attributes', 'matchers', 'collection', 'assoc']),
          {
            delim: '=',
            keyType: ['number'],
            valueType: ['number']
          })(testSpec);

        const result = transformCollection('!<Object>[1=15,2=30,3=40]', 'attributes', spec);

        expect(result.succeeded).to.be.true(functify(result));
        expect(R.keys(result.value).length).to.equal(3, functify(result));
        expect(result.value[1]).to.equal(15, functify(result));
      });

      it(`transformCollection (using default spec) should: coerce as a multiple item Object mixed type numeric keys and values`, () => {
        const spec = R.set(
          R.lensPath(['coercion', 'attributes', 'matchers', 'collection', 'assoc']), {
            delim: '=',
            keyType: ['number', 'string'],
            valueType: ['number', 'string']
          })(testSpec);

        const result = transformCollection('!<Object>[1=15,2=30,3=40,4=g,deuce=adv]', 'attributes', spec);

        expect(result.succeeded).to.be.true(functify(result));
        expect(R.keys(result.value).length).to.equal(5, functify(result));
        expect(result.value[1]).to.equal(15, functify(result));
        expect(result.value[4]).to.equal('g', functify(result));
        expect(result.value['deuce']).to.equal('adv', functify(result));
      });
    });

    context('given: invalid assoc.keyType', () => {
      it(`should: throw`, () => {
        const spec = R.set(
          R.lensPath(['coercion', 'attributes', 'matchers', 'collection', 'assoc']), {
            delim: '=',
            keyType: 'duff',
            valueType: ['number', 'string']
          })(testSpec);

        expect(() => {
          transformCollection('!<Object>[1=15,2=30,3=40,4=g,deuce=adv]', 'attributes', spec);
        }).to.throw();
      });
    });

    context('given: invalid "collection" assoc.keyType', () => {
      it(`should: throw`, () => {
        const spec = R.set(
          R.lensPath(['coercion', 'attributes', 'matchers', 'collection', 'assoc']), {
            delim: '=',
            keyType: 'collection',
            valueType: ['number', 'string']
          })(testSpec);

        expect(() => {
          transformCollection('!<Object>[1=15,2=30,3=40,4=g,deuce=adv]', 'attributes', spec);
        }).to.throw();
      });
    });

    context('given: invalid assoc.valueType', () => {
      it(`should: throw`, () => {
        const spec = R.set(
          R.lensPath(['coercion', 'attributes', 'matchers', 'collection', 'assoc']), {
            delim: '=',
            keyType: 'string',
            valueType: ['duff', 'number', 'string']
          })(testSpec);

        expect(() => {
          transformCollection('!<Object>[1=15,2=30,3=40,4=g,deuce=adv]', 'attributes', spec);
        }).to.throw();
      });
    });
  }); // convert.impl for "attributes" context [transformCollection]

  describe('convert.impl for "textNodes" context [transforms]', () => {
    context('given: invalid request for a property not applicable in "textNodes" context', () => {
      it('should: throw', () => [
        expect(() => {
          Impl.fetchCoercionOption('coercion/textNodes/matchers/collection/delim', testSpec);
        }).to.throw()
      ]);
    });

    const tests = [
      {
        should: 'textNodes.trim defined as "false" overriding attributes.trim',
        context: 'textNodes',
        path: 'coercion/textNodes/trim',
        expectedValue: false,
        spec: () => {
          return R.set(R.lensPath(['coercion', 'textNodes']),
            {
              trim: false
            }
          )(testSpec);
        }
      }
    ];

    tests.forEach((t) => {
      it(`should: ${t.should}`, () => {
        const result = Impl.fetchCoercionOption(t.path, t.spec());
        expect(result).to.be.equal(t.expectedValue);
      });
    });
  }); // convert.impl for "textNodes" context [transforms]
})();

/* eslint-disable no-useless-escape */
