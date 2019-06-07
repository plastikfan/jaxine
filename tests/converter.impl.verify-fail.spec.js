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
