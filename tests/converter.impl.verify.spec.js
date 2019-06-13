'use strict';

(function () {
  const chai = require('chai');
  chai.use(require('dirty-chai'));
  const expect = chai.expect;
  const assert = chai.assert;
  const R = require('ramda');

  const converter = require('../lib/converter');
  const Impl = require('../lib/converter.impl');

  describe('converter.impl:validateOptions [coerce]', () => {
    context('pre-defined specs coercion validation', () => {
      const specs = converter.specs;

      R.forEach((s) => {
        it(`should: not fail validation, given: valid default spec`, () => {
          try {
            Impl.validateSpec(s);
          } catch (err) {
            assert.fail(err.message);
          }
        });
      })(specs);
    });

    context('Invalid coercion options', () => {
      const baseSpec = {
        labels: {
          element: '_',
          descendants: '_children',
          text: '_text'
        }
      };

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
        },
        {
          given: 'invalid matcher order, with "string" not defined as last matcher',
          spec: () => {
            return R.set(R.lensProp('coercion'), {
              attributes: {
                matchers: {
                  string: true,
                  symbol: {
                    prefix: '$',
                    global: true
                  }
                }
              }
            })(baseSpec);
          }
        },
        {
          given: 'textNodes defined as a string',
          spec: () => {
            return R.set(R.lensProp('coercion'), {
              textNodes: 'invalid textNode(can\'t be a string'
            })(baseSpec);
          }
        },
        {
          given: 'textNodes.trim defined as a string',
          spec: () => {
            return R.set(R.lensProp('coercion'), {
              textNodes: {
                trim: 'trim can\'be a string'
              }
            })(baseSpec);
          }
        },
        {
          given: 'textNodes.matchers.collection.delim defined',
          spec: () => {
            return R.set(R.lensProp('coercion'), {
              textNodes: {
                matchers: {
                  collection: {
                    delim: '?'
                  }
                }
              }
            })(baseSpec);
          }
        },
        {
          given: 'textNodes.matchers.collection.open defined',
          spec: () => {
            return R.set(R.lensProp('coercion'), {
              textNodes: {
                matchers: {
                  collection: {
                    open: '?'
                  }
                }
              }
            })(baseSpec);
          }
        },
        {
          given: 'textNodes.matchers.collection.close defined',
          spec: () => {
            return R.set(R.lensProp('coercion'), {
              textNodes: {
                matchers: {
                  collection: {
                    close: '?'
                  }
                }
              }
            })(baseSpec);
          }
        },
        {
          given: 'invalid matcher order, with "string" not defined as last matcher',
          spec: () => {
            return R.set(R.lensProp('coercion'), {
              textNodes: {
                matchers: {
                  string: true,
                  symbol: {
                    prefix: '$',
                    global: true
                  }
                }
              }
            })(baseSpec);
          }
        }
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
