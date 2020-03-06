'use strict'
const assert = require('assert')
module.exports = (fn, cases)=>{
    for (let v of cases) {
        console.log('input:', v.input)
        console.log('expect:', v.expect)
        assert.deepStrictEqual(fn.apply(null, v.input), v.expect)
        console.log('Test OK!\n')
    }
    console.log('[Finished:', Object.keys(cases).length, 'Cases]\n')
}
