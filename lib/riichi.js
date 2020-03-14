'use strict'
const assert = require('assert')
const agari = require('agari')
const YAKU = require('./yaku')
const MPSZ = ['m', 'p', 's', 'z']
const KAZE = [undefined, '東', '南' ,'西', '北', '白', '發', '中']
const ceil10 = (num)=>{
    return Math.ceil(num/10)*10
}
const ceil100 = (num)=>{
    return Math.ceil(num/100)*100
}
const isHai = (text)=>{
    return typeof text === 'string' && text.length === 2 && !isNaN(text[0]) && MPSZ.includes(text[1])
}
const is19 = (text)=>{
    return isHai(text) && (text.includes('1') || text.includes('9') || text.includes('z'))
}
const isFuro = (arr)=>{
    if (arr instanceof Array !== true || arr.length > 4 || arr.length < 2)
        return false
    let set = new Set(arr)
    if (set.size === 1)
        return isHai(arr[0])
    else {
        if (set.size !== 3)
            return false
        let minus1 = parseInt(arr[1]) - parseInt(arr[0])
        let minus2 = parseInt(arr[2]) - parseInt(arr[1])
        if (minus1 !== minus2 || minus1 !== 1)
            return false
    }
    return true
}

/**
 * string型牌 → array型牌
 * 赤dora抽出
 */
const parse = (text)=>{
    let tmp = []
    let aka = 0
    for (let v of text) {
        if (!isNaN(v)) {
            if (v === '0')
                v = '5', aka++
            tmp.push(v)
        }
        if (MPSZ.includes(v)) {
            for (let k in tmp)
                if (!isNaN(tmp[k]))
                    tmp[k] += v
        }
    }
    let res = []
    for (let v of tmp)
        if (isNaN(v))
            res.push(v)
    return {'res': tmp, 'aka': aka}
}

class Riichi {
    /**
     * @param string data
     * Hai[+Agari][+Furo][+Dora][+Extra]
     * 
     *  m=萬子 p=筒子 s=索子 z=字牌 0=赤5牌 1z-7z=東南西北白發中
     * Examples:
     * '112233m123p123s1z1z' ※手牌112233m123p123s1z 自摸1z
     * '112233m123p123s1z+1z' ※手牌112233m123p123s1z 栄和1z
     * '1z+1z+123m55z666z7777z' ※手牌1z 栄和1z 副露:123m順子 5z暗槓 6z明刻 7z明槓
     * '1z+1z+123m55z666z7777z+d56z+trihk1' ※Dora:5z6z Extra:trihk1
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
     *  d5m = dora is 5m
     *  d56m = dora is 5m & 6m
     * 
     * Extra:
     *  t = 天和/地和/人和
     *  w = w立直
     *  r(l) = 立直
     *  i(y) = 一発
     *  h = 海底/河底
     *  k = 嶺上/槍槓
     *  1(11)=東場東家 2(12)=東場南家 3(13)=東場西家 4(14)=東場北家
     *  21=南場東家  22=南場南家 23=南場西家 24=南場北家
     *  (default: 東場南家)
     */
    constructor(data) {
        this.hai = [] //array型手牌(和了牌含) 例:['1m', '1m', '1m', '2m', '2m']
        this.haiArray = [ // 複合array型手牌(和了牌含)
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0]
        ]
        this.furo = [] //副露 例:[['1m', '1m', '1m'], ['2m', '2m'], ['3m', '4m', '5m'], ['6m', '6m', '6m', '6m']]
        this.agari = '' //和了牌 例:'2m'
        this.dora = [] //dora 例:['6z', '7z']
        this.extra = '' //付属役 例:'riho22' ※付属役一覧参照
        this.isTsumo = true //true:自摸 false:栄和
        this.isOya = false //true:親家 false:子家
        this.bakaze = 1 //場風 1234=東南西北
        this.jikaze = 2 //自風 1234=東南西北
        this.aka = 0 //赤dora枚数
        this.yakuhai = [] //
        this.agariPatterns = []
        this.currentPattern
        this.result = { //計算結果
            'isAgari': false, //和了?
            'yakuman': 0, //役満倍数
            'yaku': {}, //手役 例:{'天和':'役満','大四喜':'ダブル'}、{'立直':'1飜','清一色':'6飜'}
            'han': 0, //飜数
            'fu': 0, //符数
            'ten': 0, //点数(this.isOya=undefined場合，計算不能)
            'name': '', //例:'満貫'、'跳満'、'倍満'、'三倍満'、'数え役満'
            'text': '', //結果text 例:'30符4飜'、'40符4飜 満貫'、'6倍役満'
            'oya': [0, 0, 0], //親家得点 例:[2600,2600,2600]、[7700]
            'ko': [0, 0, 0], //子家得点 例:[3900,2000,2000]、[7700]
            'error': true //input error
        }
        this.finalResult = {} //final計算結果
        this.disabled = [] //禁止役 例:['renho', 'wriichi']
        this.allowWyakuman = true //false:二倍役満禁止
        this.allowKuitan = true //false:喰断禁止
        this.allowAka = true //false:赤dora禁止

        // 初期設定
        if (typeof data !== 'string')
            return
        data = data.toLowerCase()
        let arr = data.split('+')
        let hai = arr.shift()
        for (let v of arr) {
            if (!v.includes('m') && !v.includes('p') && !v.includes('s') && !v.includes('z'))
                this.extra = v
            else if (v[0] === 'd')
                this.dora = parse(v.substr(1)).res
            else if (isHai(v)) {
                hai += v
                this.isTsumo = false
            } else {
                let tmp = []
                for (let vv of v) {
                    if (MPSZ.includes(vv)) {
                        for (let k in tmp)
                            tmp[k] += vv
                        if (isFuro(tmp))
                            this.furo.push(tmp.sort())
                        tmp = []
                    } else {
                        if (vv === '0')
                            vv = '5', this.aka++
                        tmp.push(vv)
                    }
                }
            }
        }

        let tmp = parse(hai)
        this.hai = tmp.res
        this.aka += tmp.aka
        this.agari = this.hai.slice(-1)[0]

        if (this.hai.length % 3 !== 2)
            return
        if (this.hai.length + this.furo.length * 3 > 14)
            return

        // array型手牌 → 複合array型 転換
        for (let v of this.hai) {
            let n = parseInt(v)
            let i = MPSZ.indexOf(v.replace(n, ''))
            this.haiArray[i][n-1]++
        }

        // 場風自風設定
        let kaze = this.extra.replace(/[a-z]/g, '')
        if (kaze.length === 1)
            this.jikaze = parseInt(kaze)
        if  (kaze.length > 1) {
            this.bakaze = parseInt(kaze[0])
            this.jikaze = parseInt(kaze[1])
        }
        if (this.jikaze === 1)
            this.isOya = true
        else
            this.isOya = false

        this.result.error = false
    }

    _checkAllow(allow) {
        for (let v of this.hai)
            if (!allow.includes(v))
                return false
        for (let v of this.furo)
            for (let vv of v)
                if (!allow.includes(vv))
                    return false
        return true
    }

    // 役計算 home ----------------------------------------------------------------------------------------------------

    hasKokushi() {
        return agari.check13(this.haiArray)
    }
    hasKokushi13() {
        return this.hasKokushi() && this.hai.reduce((total, v)=>{
            return v === this.agari ? ++total : total
        }, 0) === 2
    }
    has9ren() {
        let i = MPSZ.indexOf(this.agari[1])
        return this.haiArray[i][0] >= 3 && this.haiArray[i][8] >= 3 && !this.haiArray[i].includes(0)
    }
    hasJyun9ren() {
        if (!this.has9ren())
            return false
        let n = parseInt(this.agari)
        let i = MPSZ.indexOf(this.agari[1])
        if (n === 1 || n === 9)
            return this.haiArray[i][n-1] === 4
        else
            return this.haiArray[i][n-1] === 2
    }
    has4kantsu() {
        return this.furo.length === 4 &&
            this.furo[0].length !== 3 &&
            this.furo[1].length !== 3 &&
            this.furo[2].length !== 3 &&
            this.furo[3].length !== 3
    }
    has4anko() {
        if (new Set(this.hai).size !== 5 - this.furo.length)
            return false
        for (let v of this.furo)
            if (v.length !== 2)
                return false
        return this.has3anko()
    }
    has4ankotanki() {
        return this.has4anko() && this.hai.reduce((total, v)=>{
            return v === this.agari ? ++total : total
        }, 0) === 2
    }
    hasDai4shi() {
        let need = ['1z', '2z', '3z', '4z']
        let res = this.haiArray[3][0] + this.haiArray[3][1] + this.haiArray[3][2] + this.haiArray[3][3]
        
        for (let v of this.furo)
            if (need.includes(v[0]))
                res += 3
        return res === 12
    }
    hasSyo4shi() {
        let need = ['1z', '2z', '3z', '4z']
        let res = this.haiArray[3][0] + this.haiArray[3][1] + this.haiArray[3][2] + this.haiArray[3][3]
        for (let v of this.furo)
            if (need.includes(v[0]))
                res += 3
        return res === 11
    }
    hasDai3gen() {
        let need = ['5z', '6z', '7z']
        let res = this.haiArray[3][4] + this.haiArray[3][5] + this.haiArray[3][6]
        for (let v of this.furo)
            if (need.includes(v[0]))
                res += 3
        return res === 9
    }
    hasTsu1so() {
        let allow = ['1z', '2z', '3z', '4z', '5z', '6z', '7z']
        return this._checkAllow(allow)
    }
    hasRyu1so() {
        let allow = ['2s', '3s', '4s', '6s', '8s', '6z']
        return this._checkAllow(allow)
    }
    hasChinroto() {
        let allow = ['1m', '9m', '1p', '9p', '1s', '9s']
        return this._checkAllow(allow)
    }
    hasTenho() {
        return this.extra && this.extra.includes('t') && this.isTsumo && this.isOya
    }
    hasChiho() {
        return this.extra && this.extra.includes('t') && this.isTsumo && !this.isOya
    }
    hasRenho() {
        return this.extra && this.extra.includes('t') && !this.isTsumo && !this.isOya
    }
    // 役満 boundary ----------------------------------------------------------------------------------------------------
    has7toi() {
        if (!agari.check7(this.haiArray) || this.has2peko())
            return false
        return true
    }
    hasChin1tsu() {
        let must = this.agari[1]
        let allow = []
        for (let i = 1; i <= 9; i++)
            allow.push(i + must)
        return this._checkAllow(allow)
    }
    hasHon1tsu() {
        let allow = ['1z', '2z', '3z', '4z', '5z', '6z', '7z']
        for (let v of this.hai) {
            if (['m', 'p', 's'].includes(v[1])) {
                for (let i = 1; i <= 9; i++)
                    allow.push(i + v[1])
                return this._checkAllow(allow)
            }
        } 
    }
    has3kantsu() {
        let res = 0
        for (let v of this.furo)
            if (v.length !== 3)
                res++
        return res >= 3
    }
    has3anko() {
        let res = 0
        for (let v of this.currentPattern)
            if (typeof v !== 'string' && v.length <= 2)
                res++
        return res >= 3
    }
    hasSyo3gen() {
        let need = ['5z', '6z', '7z']
        let res = this.haiArray[3][4] + this.haiArray[3][5] + this.haiArray[3][6]
        for (let v of this.furo)
            if (need.includes[v[0]])
                res += 3
        return res === 8
    }
    hasToitoi() {
        let res = 0
        for (let v of this.currentPattern)
            if (v.length === 1 || (v.length === 3 && v[0] === v[1]))
                res++
        return res === 4
    }
    hasHonroto() {
        let allow = ['1m', '9m', '1p', '9p', '1s', '9s', '1z', '2z', '3z', '4z', '5z', '6z', '7z']
        return this._checkAllow(allow)
    }
    _checkChanta(allow) {
        let hasJyuntsu = false
        for (let v of this.currentPattern) {
            if (typeof v === 'string') {
                if (!allow.includes(v))
                    return false
            } else if (v.length <= 2 || v[0] === v[1]) {
                if (!allow.includes(v[0]))
                    return false
            } else {
                hasJyuntsu = true
                let add = parseInt(v[0]) + parseInt(v[1]) + parseInt(v[2])
                if (add > 6 && add < 24)
                    return false
            }
        }
        return hasJyuntsu
    }
    hasJyunchan() {
        let allow = ['1m', '9m', '1p', '9p', '1s', '9s']
        return this._checkChanta(allow)
    }
    hasHonchan() {
        let allow = ['1m', '9m', '1p', '9p', '1s', '9s', '1z', '2z', '3z', '4z', '5z', '6z', '7z']
        return this._checkChanta(allow)
    }
    has2peko() {
        let res = []
        for (let v of this.currentPattern) {
            if (typeof v === 'string')
                continue
            if (v.length !== 3 || v[0] === v[1])
                return false
            res.push(v[0])
        }
        return new Set(res).size <= 2
    }
    has1peko() {
        for (let i in this.currentPattern) {
            i = parseInt(i)
            let v = this.currentPattern[i]
            if (v.length === 3 && v[0] != v[1]) {
                while (i < 4) {
                    i++
                    try {
                        assert.deepStrictEqual(v, this.currentPattern[i])
                        return true
                    } catch(e) {}
                }
            }
        }
        return false
    }
    has1tsu() {
        let res = [0,0,0,0,0,0,0,0,0]
        for (let v of this.currentPattern) {
            if (v.length <= 2 || v[0] === v[1])
                continue
            if ([1,4,7].includes(parseInt(v[0]))) {
                let i = MPSZ.indexOf(v[0][1])*3 + (parseInt(v[0])-1)/3
                res[i]++
            }
        }
        return (res[0] && res[1] && res[2]) || (res[3] && res[4] && res[5]) || (res[6] && res[7] && res[8])
    }
    has3doko() {
        let res = [0,0,0,0,0,0,0,0,0]
        for (let v of this.currentPattern) {
            if ((v.length === 1 || v[0] === v[1]) && !v[0].includes('z'))
                res[parseInt(v[0])-1]++
            else
                continue
        }
        return res.includes(3)
    }
    has3syoku() {
        let res = [0,0,0,0]
        for (let v of this.currentPattern) {
            if (v.length <= 2 || v[0] === v[1])
                continue
            let i = MPSZ.indexOf(v[0][1])
            if (res[i])
                res[3] = parseInt(v[0])
            else
                res[i] = parseInt(v[0])
        }
        res = new Set(res)
        return res.size <= 2 && !res.has(0)
    }
    hasTanyao() {
        for (let v of this.furo)
            if (!this.allowKuitan && v.length !== 2)
                return false
        let allow = ['2m', '3m', '4m', '5m', '6m', '7m', '8m', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '2s', '3s', '4s', '5s', '6s', '7s', '8s']
        return this._checkAllow(allow)
    }
    hasPinfu() {
        let hasAgariFu = true
        for (let v of this.currentPattern) {
            if (typeof v === 'string')  {
                if (v.includes('z') && [this.bakaze, this.jikaze, 5, 6, 7].includes(parseInt(v)))
                    return false
            } else if (v.length !== 3 || v[0] === v[1]) {
                return false
            } else if ((v[0] === this.agari && parseInt(v[2]) !== 9) || (v[2] === this.agari && parseInt(v[0]) !== 1)) {
                hasAgariFu = false
            }
        }
        return !hasAgariFu
    }
    hasYakuhai() {
        this.yakuhai = []
        for (let v of this.currentPattern) {
            if (typeof v !== 'string' && v[0].includes('z')) {
                let n = parseInt(v[0])
                if (n === this.bakaze)
                    this.yakuhai.push('場風' + KAZE[n])
                if (n === this.jikaze)
                    this.yakuhai.push('自風' + KAZE[n])
                if (n >= 5)
                    this.yakuhai.push('役牌' + KAZE[n])
            }
        }
        return false
    }
    hasTsumo() {
        return this.isTsumo
    }
    hasWriichi() {
        return this.extra && this.extra.includes('w')
    }
    hasRiichi() {
        return this.extra && (this.extra.includes('r') || this.extra.includes('l'))
    }
    has1patsu() {
        return this.extra && (this.extra.includes('i') || this.extra.includes('y'))
    }
    hasChankan() {
        return this.extra && this.extra.includes('k') && !this.isTsumo
    }
    hasRinsyan() {
        let hasKantsu = false
        for (let v of this.furo) {
            if (v.length === 2 || v.length === 4) {
                hasKantsu = true
                break
            }
        }
        return hasKantsu && this.extra && this.extra.includes('k') && this.isTsumo
    }
    hasHaitei() {
        return this.extra && this.extra.includes('h') && this.isTsumo
    }
    hasHotei() {
        return this.extra && this.extra.includes('h') && !this.isTsumo
    }
    hasDora() {
        return false
    }
    hasAka() {
        return false
    }

    // 役計算 end ----------------------------------------------------------------------------------------------------

    /**
     * 門前判定
     */
    isMenzen() {
        for (let v of this.furo)
            if (v.length > 2)
                return false
        return true
    }

    /**
     * 役牌計算
     */
    calcYakuhai() {
        this.result.han += this.yakuhai.length
        for (let v of this.yakuhai)
            this.result.yaku[v] = '1飜'
    }

    /**
     * dora枚数計算
     */
    calcDora() {
        if (!this.result.han)
            return
        let dora = 0
        for (let v of this.hai) {
            if (this.dora.includes(v))
                    dora++
        }
        for (let v of this.furo) {
            if (v.length === 2)
                v = v.concat(v)
            for (let vv of v) {
                for (let vvv of this.dora) {
                    if (vvv === vv)
                        dora++
                }
            }
        }
        if (dora) {
            this.result.han += dora
            this.result.yaku['ドラ'] = dora + '飜'
        }
        if (this.allowAka && this.aka) {
            this.result.han += this.aka
            this.result.yaku['赤ドラ'] = this.aka + '飜'
        }
    }

    /**
     * 符計算
     */
    calcFu() { 
        let fu = 0
        if (this.result.yaku['七対子']) {
            fu = 25
        } else if (this.result.yaku['平和']) {
            fu = this.isTsumo ? 20 : 30
        } else {
            fu = 20
            let hasAgariFu = false
            if (!this.isTsumo && this.isMenzen())
                fu += 10
            for (let v of this.currentPattern) {
                if (typeof v === 'string') {
                    if (v.includes('z')) 
                        for (let vv of [this.bakaze, this.jikaze, 5, 6, 7])
                            if (parseInt(v) === vv)
                                fu += 2
                    if (this.agari === v)
                        hasAgariFu = true
                } else {
                    if (v.length === 4)
                        fu += is19(v[0]) ? 16 : 8
                    else if (v.length === 2)
                        fu += is19(v[0]) ? 32 : 16
                    else if (v.length === 1)
                        fu += is19(v[0]) ? 8 : 4
                    else if (v.length === 3 && v[0] === v[1])
                        fu += is19(v[0]) ? 4 : 2
                    else if (!hasAgariFu) {
                        if (v[1] === this.agari)
                            hasAgariFu = true
                        else if (v[0] === hasAgariFu && parseInt(v[2]) === 9)
                            hasAgariFu = true
                        else if (v[2] === hasAgariFu && parseInt(v[0]) === 1)
                            hasAgariFu = true
                    }
                }
            }

            if (hasAgariFu)
                fu += 2
            if (this.isTsumo)
                fu += 2

            fu = ceil10(fu)
            if (fu < 30)
                fu = 30
        }
        this.result.fu = fu
    }

    /**
     * 点数計算
     */
    calcTen() {
        let base
        this.result.text = `(${KAZE[this.bakaze]}場`
        this.result.text += KAZE[this.jikaze] + '家)'
        this.result.text += this.isTsumo ? '自摸' : '栄和'
        if (this.result.yakuman) {
            base = 8000 * this.result.yakuman
            this.result.name = this.result.yakuman > 1 ? (this.result.yakuman + '倍役満') : '役満'
        } else {
            if (!this.result.han)
                return
            base = this.result.fu * Math.pow(2, this.result.han + 2)
            this.result.text += ' ' + this.result.fu + '符' + this.result.han + '飜'
            if (base > 2000) {
                if (this.result.han >= 13) {
                    base = 8000
                    this.result.name = '数え役満'
                } else if (this.result.han >= 11) {
                    base = 6000
                    this.result.name = '三倍満'
                } else if (this.result.han >= 8) {
                    base = 4000
                    this.result.name = '倍満'
                } else if (this.result.han >= 6) {
                    base = 3000
                    this.result.name = '跳満'
                } else {
                    base = 2000
                    this.result.name = '満貫'
                }
            }
        }
        this.result.text += (this.result.name ? ' ' : '') + this.result.name
        if (this.isTsumo) {
            this.result.oya = [ceil100(base*2),ceil100(base*2),ceil100(base*2)]
            this.result.ko = [ceil100(base*2),ceil100(base),ceil100(base)]
        } else {
            this.result.oya = [ceil100(base*6)]
            this.result.ko = [ceil100(base*4)]
        }
        this.result.ten = this.isOya ? eval(this.result.oya.join('+')) : eval(this.result.ko.join('+'))
        this.result.text += ' ' + this.result.ten + '点'
        if (this.isTsumo) {
            this.result.text += '('
            if (this.isOya)
                this.result.text += this.result.oya[0] + 'all'
            else
                this.result.text += this.result.ko[0] + ',' + this.result.ko[1]
            this.result.text += ')'
        }

    }

    /**
     * 手役計算
     */
    calcYaku(arr) {
        for (let k in arr) {
            let v = arr[k]
            let name = YAKU[v].name
            let method = 'has' + name[0].toUpperCase() + name.substr(1)
            if (this.disabled.includes(v) || this.disabled.includes(name) || (YAKU[v].menzenOnly && !this.isMenzen()) || !this[method]()) {
                delete arr[k]
            } else {
                if (YAKU[v].yakuman) {
                    let n = this.allowWyakuman ? YAKU[v].yakuman : 1
                    this.result.yakuman += n
                    this.result.yaku[v] = n > 1 ? 'ダブル役満' : '役満'
                } else {
                    let n = YAKU[v].han
                    if (YAKU[v]['menzen+1'] && this.isMenzen())
                        n++
                    this.result.yaku[v] = n + '飜'
                    this.result.han += n
                }
                let set = arr.filter((value)=>{
                    return YAKU[v].coexist.includes(value)
                })
                this.calcYaku(set)
                break
            }
        }
    }

    // api exports ↓ ----------------------------------------------------------------------------------------------------

    disableWyakuman() { //二倍役満禁止
        this.allowWyakuman = false
    }
    disableKuitan() { //喰断禁止
        this.allowKuitan = false
    }
    disableAka() { //赤dora禁止
        this.allowAka = false
    }
    enableAllLocaleYaku() { //全部locale役有効
        this.allLocaleEnabled = true
    }
    enableLocaleYaku(name) { //指定locale役有効
        this.localeEnabled.push(name)
    }
    disableYaku(name) { //指定役禁止
        this.disabled.push(name)
    }

    // supported locale yaku list
    // 大七星 役満(字一色別)
    // 人和 役満
    // 

    /**
     * main
     */
    calc() {
        if (this.result.error) {
            return this.result
        }
        this.result.isAgari = agari.checkAll(this.haiArray)
        if (!this.result.isAgari) {
            // todo 牌理
            return this.result
        }
        if (this.hai.length + this.furo.length * 3 !== 14) {
            return this.result
        }
        this.agariPatterns = agari(this.haiArray)
        for (let v of this.agariPatterns) {
            if (!this.isTsumo) {
                for (let k in v) {
                    let vv = v[k]
                    if (vv.length === 1 && vv[0] === this.agari) {
                        let i = MPSZ.indexOf(this.agari[1])
                        if (this.haiArray[i][parseInt(this.agari)-1] < 4)
                            v[k] = [vv[0], vv[0], vv[0]]
                    }
                }
            }
            this.result = {
                'isAgari': true,
                'yakuman': 0,
                'yaku': {},
                'han': 0,
                'fu': 0,
                'ten': 0,
                'name': '',
                'text': '',
                'oya': [0, 0, 0],
                'ko': [0, 0, 0],
                'error': false
            }
            this.currentPattern = v.concat(this.furo)
            this.calcYaku(Object.keys(YAKU))
            if (!this.result.yakuman) {
                this.calcYakuhai()
                this.calcDora()
                this.calcFu()
            }
            this.calcTen()
            if (this.finalResult.ten >= this.result.ten)
                continue
            else
                this.finalResult = JSON.parse(JSON.stringify(this.result))
        }
        if (!this.agariPatterns.length) {
            this.calcYaku(Object.keys(YAKU))
            if (!this.result.yakuman) {
                this.calcYakuhai()
                this.calcDora()
                this.calcFu()
            }
            this.calcTen()
            this.finalResult = this.result
        }
        return this.finalResult
    }
}

module.exports = Riichi
console.log(new Riichi('6667899s9s+99m99p').calc())
console.log(new Riichi('6667899s9s+99m99p'))