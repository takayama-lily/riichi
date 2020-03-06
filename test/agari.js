'use strict'
console.log('[Module: agari Start]\n')
const agari = require('../lib/agari')
const cases = [
    {
        input: [
            [
                [4,1,1,1,1,1,1,1,3],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0]
            ]
        ],
        expect: true
    },
    {
        input: [
            [
                [3,1,1,1,1,1,1,1,3],
                [1,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0]
            ]
        ],
        expect: false
    }
]

const cases7 = [
    {
        input: [
            [
                [2,0,0,0,0,0,0,0,2],
                [0,0,2,0,0,2,0,0,0],
                [0,0,0,0,0,2,0,0,0],
                [0,0,2,2,0,0,0]
            ]
        ],
        expect: true
    },
    {
        input: [
            [
                [3,1,1,1,1,1,1,1,3],
                [1,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0]
            ]
        ],
        expect: false
    }
]

const cases13 = [
    {
        input: [
            [
                [1,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,1],
                [1,1,2,1,1,1,1]
            ]
        ],
        expect: true
    },
    {
        input: [
            [
                [3,1,1,1,1,1,1,1,3],
                [1,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0]
            ]
        ],
        expect: false
    }
]

require('./common')(agari.check, cases)
require('./common')(agari.check7, cases7)
require('./common')(agari.check13, cases13)
console.log('[Module: agari End]\n')
