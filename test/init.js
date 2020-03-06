'use strict'
console.log('[Module: MJ.prototype.init Start]\n')
const MJ = require('../index')
const cases = [
    {
        'input': ['0m-5m+1m'],
        'expect': { hai: '0m', agari: '5m', dora: '1m', isTsumo: false }
    },
    {
        'input': ['0m+5m+1m'],
        'expect': { hai: '0m', agari: '5m', dora: '1m', isTsumo: true }
    },
    {
        'input': ['0m-1111m234p550p66s-5m+1m'],
        'expect': { hai: '0m', furo: '1111m234p550p66s', agari: '5m', dora: '1m', isTsumo: false }
    },
    {
        'input': ['0m-1111m234p550p66s+5m+1m'],
        'expect': { hai: '0m', furo: '1111m234p550p66s', agari: '5m', dora: '1m', isTsumo: true }
    },
    {
        'input': ['0m-5m+1m+h'],
        'expect': { hai: '0m', agari: '5m', dora: '1m', extra: 'h', isTsumo: false }
    },
    {
        'input': ['0m+5m+1m+h'],
        'expect': { hai: '0m', agari: '5m', dora: '1m', extra: 'h', isTsumo: true }
    },
    {
        'input': ['0m-1111m234p550p66s-5m+1m+h'],
        'expect': { hai: '0m', furo: '1111m234p550p66s', agari: '5m', dora: '1m', extra: 'h', isTsumo: false }
    },
    {
        'input': ['0m-1111m234p550p66s+5m+1m+h'],
        'expect': { hai: '0m', furo: '1111m234p550p66s', agari: '5m', dora: '1m', extra: 'h', isTsumo: true }
    }
]
require('./common')(MJ.prototype.init, cases)
console.log('[Module: MJ.prototype.init End]\n')
