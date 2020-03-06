'use strict'
const MJ = module.exports = require('./lib/mj')

MJ.calc = data=>{
    return new MJ(data).calc()
}

MJ.isAgari = require('./lib/agari')
MJ.syanten = require('./lib/syanten')
