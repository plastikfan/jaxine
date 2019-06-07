'use strict';

(function () {
  const chai = require('chai');
  chai.use(require('dirty-chai'));
  const expect = chai.expect;
  const R = require('ramda');

  const Impl = require('../lib/converter.impl');

  describe('converter.impl:validateOptions [coerce]', () => {
    const baseSpec = {
      labels: {
        element: '_',
        descendants: '_children',
        text: '_text'
      }
    };

    context('Invalid coercion options', () => {
      const tests = [
        {
          given: 'coercion with typo in "trim" property',
          spec: () => {
            return R.set(R.lensProp('coercion'), {
              attributes: {
                trim: 'terue'
              }
            })(baseSpec);
          }
        },
        {
          given: 'matchers containing invalid primitives("blah") defined',
          spec: () => {
            return R.set(R.lensProp('coercion'), {
              attributes: {
                matchers: {
                  primitives: ['blah', 'number', 'boolean']
                }
              }
            })(baseSpec);
          }
        },
        {
          given: 'collection matcher with invalid "delim" defined',
          spec: () => {
            return R.set(R.lensProp('coercion'), {
              attributes: {
                matchers: {
                  collection: {
                    delim: 666
                  }
                }
              }
            })(baseSpec);
          }
        },
        {
          given: 'collection matcher with null "delim" defined',
          spec: () => {
            return R.set(R.lensProp('coercion'), {
              attributes: {
                matchers: {
                  collection: {
                    delim: null
                  }
                }
              }
            })(baseSpec);
          }
        },
        {
          given: 'date matcher with invalid "format" defined',
          spec: () => {
            return R.set(R.lensProp('coercion'), {
              attributes: {
                matchers: {
                  date: {
                    format: 666
                  }
                }
              }
            })(baseSpec);
          }
        },
        {
          given: 'symbol matcher with invalid "prefix" defined',
          spec: () => {
            return R.set(R.lensProp('coercion'), {
              attributes: {
                matchers: {
                  symbol: {
                    prefix: 666
                  }
                }
              }
            })(baseSpec);
          }
        },

        {
          given: 'symbol matcher with invalid "global" defined',
          spec: () => {
            return R.set(R.lensProp('coercion'), {
              attributes: {
                matchers: {
                  symbol: {
                    global: 666
                  }
                }
              }
            })(baseSpec);
          }
        }

        // {
        //   given: 'collection matcher with invalid "delim" defined',
        //   spec: () => {
        //     return R.set(R.lensProp('coercion'), {
        //       attributes: {
        //         matchers: {
        //           collection: {
        //             delim: ',',
        //             open: '!<[]>[',
        //             close: ']',
        //             throwIfMatchFails: false,
        //             payload: {
        //               delim: '=',
        //               valuetype: 'primitive'
        //             }
        //           }
        //         }
        //       }
        //     })(baseSpec);
        //   }
        // }

      ];

      R.forEach((t) => {
        it(`should: throw, given: ${t.given}`, () => {
          expect(() => {
            Impl.validateSpec(t.spec());
          }).to.throw();
        });
      })(tests);
    });
  });
})();
