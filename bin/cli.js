'use strict'
let argument = process.argv.slice(-1)[0]
if (process.argv.length <= 2 || argument === '-h' || argument === '--help') {
    let msg = `
    * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    * Usage: Hai[+Agari][+Furo][+Dora][+Extra]
    * 
    * Examples:
    * '112233m123p123s1z1z' ※手牌112233m123p123s1z 自摸1z
    * '112233m123p123s1z+1z' ※手牌112233m123p123s1z 栄和1z
    * '1z+1z+123m55z666z7777z' ※手牌1z 栄和1z 副露:123m順子 5z暗槓 6z明刻 7z明槓
    * '1z+1z+123m55z666z7777z+d56z+trihk1' ※Dora:5z6z Extra:trihk1
    * ※m=萬子 p=筒子 s=索子 z=字牌 0=赤5牌 1z-7z=東南西北白發中
    * 
    * Agari:
    *  123m1z = 自摸1z
    *  123m+1z = 栄和1z
    * 
    * Furo:
    *  11m = 暗槓1m
    *  111m = 明刻1m
    *  1111m = 明槓1m
    *  123m = 順子123m
    * 
    * Dora:
    *  prefix 'd'
    *  d5m = dora 5m
    *  d56m = dora 5m 6m
    * 
    * Extra:
    *  t = 天和/地和/人和
    *  w = w立直
    *  r(l) = 立直
    *  i(y) = 一発
    *  h = 海底/河底
    *  k = 嶺上/槍槓
    *  o = 全local役有効
    *  1(11)=東場東家 2(12)=東場南家 3(13)=東場西家 4(14)=東場北家
    *  21=南場東家  22=南場南家 23=南場西家 24=南場北家
    *  (default: 東場南家)
    * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
`
    console.log(msg)
} else {
    const Riichi = require('../index.js')
    const riichi = new Riichi(argument)
    let result = riichi.calc()
    console.log(result)
}
