'use strict';

(function () {
  const chai = require('chai');
  chai.use(require('dirty-chai'));
  const assert = chai.assert;

  const R = require('ramda');
  const Impl = require('../lib/converter.impl');

  // THIS FILE IS PROBABLY NO LONGER REQUIRED

  describe.skip('converter.impl:validateOptions [coerce]', () => {
    const baseSpec = {
      labels: {
        element: '_',
        descendants: '_children',
        text: '_text'
      }
    };

    context('Valid coercion options', () => {
      const tests = [
        {
          given: 'coercion with only trim property',
          spec: () => {
            return R.set(R.lensProp('coercion'), {
              attributes: {
                trim: true
              }
            })(baseSpec);
          }
        },
        {
          given: 'spec without coercion property',
          spec: () => baseSpec
        },
        {
          given: 'matchers with valid primitives("number", "boolean") defined',
          spec: () => {
            return R.set(R.lensProp('coercion'), {
              attributes: {
                matchers: {
                  primitives: ['number', 'boolean']
                }
              }
            })(baseSpec);
          }
        },
        {
          given: 'empty matchers',
          spec: () => {
            return R.set(R.lensProp('coercion'), {
              attributes: {
                matchers: { }
              }
            })(baseSpec);
          }
        },
        {
          given: 'collection matcher with implicit default definition',
          spec: () => {
            return R.set(R.lensProp('coercion'), {
              attributes: {
                matchers: {
                  collection: { }
                }
              }
            })(baseSpec);
          }
        },
        {
          given: 'collection matcher with explicit default definition',
          spec: () => {
            return R.set(R.lensProp('coercion'), {
              attributes: {
                matchers: {
                  collection: {
                    delim: ',',
                    open: '!<[]>[',
                    close: ']',
                    throwIfMatchFails: false,
                    payload: {
                      delim: '=',
                      valuetype: 'primitive'
                    }
                  }
                }
              }
            })(baseSpec);
          }
        }
      ];

      R.forEach((t) => {
        it(`should: not fail validation, given: ${t.given}`, () => {
          try {
            Impl.validateSpec(t.spec());
          } catch (err) {
            assert.fail(err.message);
          }
        });
      })(tests);
    });
  });
})();
