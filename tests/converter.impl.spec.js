
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
  const Impl = require('../lib/converter.impl');

  const getTestOptions = (el) => {
    return {
      id: 'name',
      recurse: 'inherits',
      discards: ['inherits', 'abstract']
    };
  };

  describe('converter:buildElement', () => {
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
          let command = Impl.buildElement(leafCommandNode, commandsNode, getTestOptions);

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('leaf'),
            'describe': R.equals('this is a leaf command'),
            'type': R.equals('native')
          })(command), command);

          expect(result).to.be.true();
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
          let command = Impl.buildElement(leafCommandNode, commandsNode, getTestOptions);

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('leaf'),
            'describe': R.equals('this is a leaf command'),
            'type': R.equals('native')
          })(command), command);

          expect(result).to.be.true();
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
            Impl.buildElement(invalidCommandNode, commandsNode, getTestOptions);
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

          let element = Impl.buildElement(expressionNode, expressionsNode, (el) => {
            return {
              id: 'name'
            };
          });

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals(`person's-name-expression`),
            'eg': R.equals('Mick Mars')
          })(element), element);

          expect(result).to.be.true();
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

          let source = Impl.buildElement(expressionNode, sourcesNode, (el) => {
            return {
              id: 'name'
            };
          });

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('some-json-source'),
            'provider': R.equals('json-provider')
          })(source), source);

          expect(result).to.be.true();
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

          let source = Impl.buildElement(argumentNode, argumentsNode, (el) => {
            return {
              id: 'name'
            };
          });

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('filesys'),
            'alias': R.equals('fs'),
            'optional': R.equals('true')
          })(source), source);

          expect(result).to.be.true();
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

          let tree = Impl.buildElement(treeNode, treesNode, (el) => {
            return {
              id: 'alias'
            };
          });

          let result = Helpers.logIfFailedStringify(R.where({
            'alias': R.equals('skipa'),
            'root': R.equals('/Volumes/Epsilon/Skipa')
          })(tree), tree);

          expect(result).to.be.true();
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
            let command = Impl.buildElement(leafCommandNode, commandsNode, getTestOptions);

            let result = Helpers.logIfFailedStringify(R.where({
              'name': R.equals('leaf'),
              'describe': R.equals('this is a leaf command'),
              'type': R.equals('native')
            })(command), command);

            expect(result).to.be.true();
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
            let command = Impl.buildElement(leafCommandNode, commandsNode, getTestOptions);

            let result = Helpers.logIfFailedStringify(R.where({
              'name': R.equals('leaf'),
              'describe': R.equals('this is a leaf command'),
              'type': R.equals('native')
            })(command), command);

            expect(result).to.be.true();
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
            let command = Impl.buildElement(leafCommandNode, commandsNode, getTestOptions);

            let result = Helpers.logIfFailedStringify(R.where({
              'name': R.equals('leaf'),
              'describe': R.equals('this is a leaf command'),
              'type': R.equals('native'),
              'filter': R.equals('beta')
            })(command), command);

            expect(result).to.be.true();
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
          let command = Impl.buildElement(leafCommandNode, commandsNode, getTestOptions);

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('leaf'),
            'describe': R.equals('this is a leaf command'),
            'type': R.equals('native'),
            'filter': R.equals('beta')
          })(command), command);

          expect(result).to.be.true();
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
          let command = Impl.buildElement(leafCommandNode, commandsNode, getTestOptions);

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('leaf'),
            'describe': R.equals('this is a leaf command'),
            'album': R.equals('powerslave'),
            'filter': R.equals('alpha'),
            'type': R.equals('native'),
            'theme': R.equals('concept')
          })(command), command);

          expect(result).to.be.true();
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
          let command = Impl.buildElement(leafCommandNode, commandsNode, getTestOptions);

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('leaf'),
            'describe': R.equals('this is a leaf command'),
            'filter': R.equals('leaf-filter')
          })(command), command);

          expect(result).to.be.true();
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
          let command = Impl.buildElement(leafCommandNode, commandsNode, getTestOptions);

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('leaf'),
            'describe': R.equals('this is a leaf command'),
            'album': R.equals('powerslave'),
            'filter': R.equals('alpha'),
            'type': R.equals('native'),
            'theme': R.equals('concept')
          })(command), command);

          expect(result).to.be.true();
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
          let command = Impl.buildElement(leafCommandNode, commandsNode, getTestOptions);

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('leaf'),
            'describe': R.equals('this is a leaf command'),
            'album': R.equals('powerslave'),
            'filter': R.equals('alpha'),
            'type': R.equals('native'),
            'theme': R.equals('concept')
          })(command), command);

          expect(result).to.be.true();
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
          let command = Impl.buildElement(leafCommandNode, commandsNode, getTestOptions);

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('leaf'),
            'describe': R.equals('this is a leaf command'),
            'filter': R.equals('beta-filter'),
            'mode': R.equals('auto')
          })(command), command);

          expect(result).to.be.true();
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
            Impl.buildElement(leafCommandNode, commandsNode, getTestOptions);
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
            Impl.buildElement(leafCommandNode, commandsNode, getTestOptions);
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

        let command = Impl.buildElement(testCommandNode, commandsNode, getTestOptions);

        if (command) {
          it('should: return a command object with all children attached', () => {
            let result = Helpers.logIfFailedStringify(R.where({
              'name': R.equals('test'),
              'describe': R.equals('Test regular expression definitions'),
              '_': R.equals('Command'),
              '_children': R.is(Array)
            })(command), command);

            expect(result).to.be.true();
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

        let command = Impl.buildElement(testCommandNode, commandsNode, getTestOptions);

        if (command) {
          it('should: return a command object with all children attached', () => {
            let result = Helpers.logIfFailedStringify(R.where({
              'name': R.equals('test'),
              'describe': R.equals('Test regular expression definitions'),
              '_': R.equals('Command'),
              '_children': R.is(Array)
            })(command), command);

            expect(result).to.be.true();
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

        let command = Impl.buildElement(testCommandNode, commandsNode, getTestOptions);

        if (command) {
          it('should: return a command object with all children attached', () => {
            let result = Helpers.logIfFailedStringify(R.where({
              'name': R.equals('test'),
              'describe': R.equals('Test regular expression definitions'),
              '_': R.equals('Command'),
              '_children': R.is(Array)
            })(command), command);

            expect(result).to.be.true();
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
          let command = Impl.buildElement(expressionNode, expressionsNode, getTestOptions);

          let result = Helpers.logIfFailedStringify(R.where({
            'name': R.equals('meta-prefix-expression')
          })(command), command);

          expect(result).to.be.true();
        } else {
          assert.fail('Couldn\'t get Expressions node.');
        }
      });
    });
  }); // converter:buildElement

  describe('converter:composeText', () => {
    context('given: a Pattern element with a single text child', () => {
      it('should return the trimmed text.', () => {
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
          let result = Impl.composeText(patternNode);

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
          let result = Impl.composeText(patternNode);

          expect(result).to.equal('.SOME-CDATA-TEXT');
        } else {
          assert.fail('Couldn\'t get Pattern node.');
        }
      });
    });

    context('given: a Pattern element with a single text child followed by single CDATA section', () => {
      it('return raw text child concatenated with CDATA text.', () => {
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
          let result = Impl.composeText(patternNode);

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
          let result = Impl.composeText(patternNode);

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
          let result = Impl.composeText(patternNode);

          expect(result).to.equal('.SOME-CDATA-TEXT');
        } else {
          assert.fail('Couldn\'t get Pattern node.');
        }
      });
    });
  }); // converter:composeText
})();

/* eslint-disable no-useless-escape */
