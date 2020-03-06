'use strict'
console.log('[Module: MJ.prototype.parse Start]\n')
const MJ = require('../index')
const cases = [
    {
        'input': ['1111m234p550s666z'],
        'expect': { 'res': [ '1m', '1m', '1m', '1m', '2p', '3p', '4p', '5s', '5s', '5s', '6z', '6z', '6z' ], 'aka': 1 }
    }
]
require('./common')(MJ.prototype.parse, cases)
console.log('[Module: MJ.prototype.parse End]\n')
