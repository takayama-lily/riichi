'use strict'
const sum = (v)=>{ //枚数計算
    let s = 0
    for (let i in v)
        s += v[i]
    return s
}
const check7 = (h)=>{ //七対子形
    let v = h[0].concat(h[1]).concat(h[2]).concat(h[3])
    let s = 0
    for (let i in v) {
        if (v[i] && v[i] != 2) return false
        s += v[i]
    }
    return s == 14
}
const check13 = (h)=>{ //国士形
    let v = [h[0][0], h[0][8], h[1][0], h[1][8], h[2][0], h[2][8]].concat(h[3])
    return v.indexOf(0) == -1 && sum(v) == 14
}
const check = (h)=>{ //一般形
    const _check = (e, f = false)=>{ // f：is字牌
        let v = e.concat()
        if (!sum(v)) return true
        if (sum(v) % 3 == 2) { //search雀頭
            for (let i in v) {
                if (v[i] >= 2) v[i] -= 2
                else continue
                if (!_check(v, f)) v[i] += 2
                else return true
            }
            return false
        }
        for (let i in v) { //search順子、刻子
            if (!v[i]) {
                continue
            } else if (v[i] == 3) {
                delete v[i]
                continue
            } else {
                if (f || i >= 7) return false
                if (v[i] == 4) v[i] -= 3
                i = parseInt(i)
                v[i+1] -= v[i]
                v[i+2] -= v[i]
                if (v[i+1] < 0 || v[i+2] < 0) return false
                v[i] = 0
            }
        }
        return true
    }
    let j = 0 //雀頭数
    for (let i in h) {
        if (sum(h[i]) % 3 == 1) return false
        j += sum(h[i]) % 3 == 2
    }
    return j == 1 && _check(h[3], true) && _check(h[0]) && _check(h[1]) && _check(h[2]) 
}

module.exports = (h)=>{
    return check7(h) || check13(h) || check(h)
}
module.exports.check = check
module.exports.check7 = check7
module.exports.check13 = check13
