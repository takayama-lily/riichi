'use strict'
const MPSZ = ['m', 'p', 's', 'z']
const YAKU = require('./yaku')
const agari = require('./agari')
const syanten = require('./syanten')
const ceil10 = (num)=>{
    return Math.ceil(num/10)*10
}
const ceil100 = (num)=>{
    return Math.ceil(num/100)*100
}
const is19 = (hai)=>{
    return hai.includes('1') || hai.includes('9') || hai.includes('z')
}

class MJ {
    /**
     * @param data
     * pattern1:
     *  '3m456p-99s6666z777z+3m+56z+trihko11'
     * pattern2:
     *  {
     *      'hai': '3m456p',
     *      'furo': '99s6666z777z',
     *      'agari': '3m',
     *      'dora': '56z',
     *      'extra': 'trihko11',
     *      'isTsumo': true
     *  }
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
        this.isTsumo = false //true:自摸 false:栄和
        this.isOya = undefined //true:親家 false:子家 undefined:未設定
        this.bakaze = 1 //場風 1234=東南西北
        this.jikaze = 1 //自風 1234=東南西北
        this.aka = 0 //赤dora枚数
        this.yakuhai = []
        this.result = { //計算結果
            'isAgari': false, //和了?
            'syanten': 0, //向聴数
            'hairi': [], //牌理(未和了限定)
            'yakuman': 0, //役満倍数
            'yaku': {}, //手役 例:{'天和':'役満','大四喜':'ダブル'}、{'立直':'1飜','清一色':'6飜'}
            'han': 0, //飜数
            'fu': 0, //符数
            'ten': 0, //点数(this.isOya=undefined場合，計算不能)
            'text': '', //結果text 例:'30符4飜'、'40符4飜 満貫'、'6倍役満'
            'oya': [0, 0, 0], //親家得点 例:[2600,2600,2600]、[7700]
            'ko': [0, 0, 0] //子家得点 例:[3900,2000,2000]、[7700]
        }
        this.disabled = [] //禁止役 例:['renho', 'wriichi']
        this.allowWyakuman = true //false:二倍役満禁止
        this.allowKuitan = true //false:喰断禁止
        this.allowAka = true //false:赤dora禁止

        // 初期設定
        try {
            if (typeof data === 'string')
                data = this.init(data)

            // 手牌、和了牌、dora、付属役設定
            let parse = this.parse(data.hai)
            this.hai = parse.res
            this.aka += parse.aka
            parse = this.parse(data.agari)
            this.agari = parse.res[0]
            this.aka += parse.aka
            this.hai.push(this.agari)
            if (data.dora)
                this.dora = this.parse(data.dora).res
            if (data.extra)
                this.extra = data.extra.toLowerCase()
            this.isTsumo = data.isTsumo

            // array型手牌 → 複合array型 転換
            for (let v of this.hai) {
                let n = parseInt(v)
                let i = MPSZ.indexOf(v.replace(n, ''))
                this.haiArray[i][n-1]++
            }

            // 副露設定
            if (data.furo) {
                let tmp = []
                for (let v of data.furo.toLowerCase()) {
                    if (MPSZ.includes(v)) {
                        for (let k in tmp)
                            tmp[k] += v
                        this.furo.push(tmp)
                        tmp = []
                    } else {
                        if (v === '0')
                            v = 5, this.aka++
                        tmp.push(v)
                    }
                }
            }

            // 場風自風設定
            if (this.extra.includes('o'))
                this.isOya = true
            if (this.extra.includes('c'))
                this.isOya = false
            let kaze = this.extra.replace(/[a-z]/g, '')
            if (kaze.length === 1)
                this.jikaze = parseInt(kaze)
            if  (kaze.length > 1) {
                this.bakaze = parseInt(kaze[0])
                this.jikaze = parseInt(kaze[1])
            }
        } catch(e) {
            throw new Error('input error')
            // console.log(e)
        }
    }

    /**
     * string型牌 → array型牌
     * 赤dora抽出
     */
    parse(text) {
        text = text.toLowerCase()
        let res = []
        let aka = 0
        for (let v of text) {
            if (!isNaN(v)) {
                if (v === '0')
                    v = '5', aka++
                res.push(v)
            }
            if (MPSZ.includes(v)) {
                for (let k in res)
                    if (!isNaN(res[k]))
                        res[k] += v
            }
        }
        return {'res': res, 'aka': aka}
    }

    /**
     * string input → object input
     */
    init(data) {
        let res = {}
        let arr = data.split('+')
        res.hai = arr.shift()
        if (res.hai.replace(/[mpsz]/g, '').length % 3 === 2) {
            res.agari = res.hai.substr(-2)
            res.hai = res.hai.substr(0, res.hai.length-2)
            res.hai += res.agari.substr(1)
            res.isTsumo = true
        }
        if (!res.agari) {
            res.agari = arr.shift()
            res.isTsumo = false
        }
        for (let v of arr) {
            if (!v.includes('m') && !v.includes('p') && !v.includes('s') && !v.includes('z'))
                res.extra = v
            else if (v[0] === 'd')
                res.dora = v.substr(1)
            else
                res.furo = v
        }
        return res
    }

    checkAllow(allow) {
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
        let i = MPSZ.indexOf(this.agari.substr(1))
        return this.haiArray[i][0] >= 3 && this.haiArray[i][8] >= 3 && !this.haiArray[i].includes(0)
    }
    hasJyun9ren() {
        if (!this.has9ren())
            return false
        let n = parseInt(this.agari)
        let i = MPSZ.indexOf(this.agari.substr(1))
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
        return this.checkAllow(allow)
    }
    hasRyu1so() {
        let allow = ['2s', '3s', '4s', '6s', '8s', '6z']
        return this.checkAllow(allow)
    }
    hasChinroto() {
        let allow = ['1m', '9m', '1p', '9p', '1s', '9s']
        return this.checkAllow(allow)
    }
    hasTenho() {
        return this.extra && this.extra.includes('t') && this.isTsumo && (this.isOya || this.isOya === undefined)
    }
    hasChiho() {
        return this.extra && this.extra.includes('t') && this.isTsumo && (this.isOya === false)
    }
    hasRenho() {
        return this.extra && this.extra.includes('t') && !this.isTsumo // bug 親家天和栄和
    }
    // 役満 boundary ----------------------------------------------------------------------------------------------------
    has7toi() {
        if (!this.isMenzen() || this.has2peko())
            return false
        return agari.check7(this.haiArray)
    }
    hasChin1tsu() {
        let must = this.agari.substr(1)
        let allow = []
        for (let i = 1; i <= 9; i++)
            allow.push(i + must)
        return this.checkAllow(allow)
    }
    hasHon1tsu() {
        let allow = ['1z', '2z', '3z', '4z', '5z', '6z', '7z']
        for (let v of this.hai) {
            if (['m', 'p', 's'].includes(v.substr(1))) {
                for (let i = 1; i <= 9; i++)
                    allow.push(i + v.substr(1))
                return this.checkAllow(allow)
            }
        } 
    }
    has3kantsu() {
        let res = 0
        for (let v of this.furo)
            if (v.length !== 3 && v[0] === v[1])
                res++
        return res >= 3
    }
    has3anko() {
        let res = 0
        for (let v of this.furo)
            if (v.length === 2 && v[0] === v[1])
                res++
        for (let k in this.haiArray) {
            for (let kk in this.haiArray[k]) {
                if (this.haiArray[k][kk] < 3)
                    continue
                this.haiArray[k][kk] -= 3
                if (agari.check(this.haiArray))
                    res++
                this.haiArray[k][kk] += 3
            }
        }
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
        for (let v of this.furo)
            if (v.length !== 3 || (v.length === 3 && v[0] === v[1]))
                res++
        for (let k in this.haiArray) {
            for (let kk in this.haiArray[k]) {
                if (this.haiArray[k][kk] < 3)
                    continue
                this.haiArray[k][kk] -= 3
                if (agari.check(this.haiArray))
                    res++
                this.haiArray[k][kk] += 3
            }
        }
        return res === 4
    }
    hasHonroto() {
        let allow = ['1m', '9m', '1p', '9p', '1s', '9s', '1z', '2z', '3z', '4z', '5z', '6z', '7z']
        return this.checkAllow(allow)
    }
    hasJyunchan() {
        let allow = ['1m', '2m', '3m', '7m', '8m', '9m', '1p', '2p', '3p', '7p', '8p', '9p', '1s', '2s', '3s', '7s', '8s', '9s']
        return this.checkAllow(allow) && this.hasHonchan()
    }
    hasHonchan() {
        let allow = ['1m', '9m', '1p', '9p', '1s', '9s', '1z', '2z', '3z', '4z', '5z', '6z', '7z']
        for (let v of this.furo) {
            if (v[0] === v[1]) {
                if (!allow.includes(v[0]))
                    return false
            }
            else {
                let add = parseInt(v[0]) + parseInt(v[1]) + parseInt(v[2])
                if (add > 6 || add < 24)
                    return false
            }
        }
        let tmp = JSON.parse(JSON.stringify(this.haiArray))
        for (let k in tmp) {
            if (k == 3)
                break
            let min1 = Math.min(tmp[k][0], tmp[k][1], tmp[k][2])
            tmp[k][0] -= min1
            tmp[k][1] -= min1
            tmp[k][2] -= min1
            let min2 = Math.min(tmp[k][6], tmp[k][7], tmp[k][8])
            tmp[k][6] -= min2
            tmp[k][7] -= min2
            tmp[k][8] -= min2
        }

        if (!agari.check(tmp))
            return false
        tmp.pop()
        
        for (let v of tmp)
            for (let k of v)
                if (v[k] && k > 0 && k < 8)
                    return false
        return true
    }
    has2peko() {
        let res = 0
        let tmp = JSON.parse(JSON.stringify(this.haiArray))
        for (let k in tmp) {
            for (let kk in tmp[k]) {
                kk = parseInt(kk)
                if (tmp[k][kk] >= 2 && tmp[k][kk+1] >= 2 && tmp[k][kk+2] >= 2) {
                    let min = Math.min(tmp[k][kk], tmp[k][kk+1], tmp[k][kk+2]) >= 4 ? 4 : 2
                    res += min / 2
                    tmp[k][kk] -= min
                    tmp[k][kk+1] -= min
                    tmp[k][kk+2] -= min
                    if (!agari.check(tmp))
                        return false
                }
            }
        }
        return res === 2
    }
    has1peko() {
        let tmp = JSON.parse(JSON.stringify(this.haiArray))
        for (let k in tmp) {
            for (let kk in tmp[k]) {
                kk = parseInt(kk)
                if (tmp[k][kk] >= 2 && tmp[k][kk+1] >= 2 && tmp[k][kk+2] >= 2) {
                    tmp[k][kk] -= 2
                    tmp[k][kk+1] -= 2
                    tmp[k][kk+2] -= 2
                    if (agari.check(tmp))
                        return true
                    tmp[k][kk] += 2
                    tmp[k][kk+1] += 2
                    tmp[k][kk+2] += 2
                }
            }
        }
        return false
    }
    has1tsu() {
        let tmp = JSON.parse(JSON.stringify(this.haiArray))
        for (let k in tmp) {
            if (!tmp[k].includes(0)) {
                tmp[k].forEach((v, i, arr)=>{
                    arr[i]--
                })
                return agari.check(tmp)
            }
        }
        return false
    }
    has3doko() {
        let tmp = JSON.parse(JSON.stringify(this.haiArray))
        for (let k in tmp[0]) {
            if (tmp[0][k] >= 3 && tmp[1][k] >= 3 && tmp[2][k] >= 3) {
                tmp[0][k] -= 3
                tmp[1][k] -= 3
                tmp[2][k] -= 3
                if (!agari.check(tmp))
                    return false
                return true
            }
        }
        return false
    }
    has3syoku() {
        let tmp = JSON.parse(JSON.stringify(this.haiArray))
        for (let k in tmp[0]) {
            k = parseInt(k)
            if (tmp[0][k] >= 1 && tmp[1][k] >= 1 && tmp[2][k] >= 1 &&
                tmp[0][k+1] >= 1 && tmp[1][k+1] >= 1 && tmp[2][k+1] >= 1 &&
                tmp[0][k+2] >= 1 && tmp[1][k+2] >= 1 && tmp[2][k+2] >= 1) {
                tmp[0][k]--
                tmp[1][k]--
                tmp[2][k]--
                tmp[0][k+1]--
                tmp[1][k+1]--
                tmp[2][k+1]--
                tmp[0][k+2]--
                tmp[1][k+2]--
                tmp[2][k+2]--
                if (!agari.check(tmp))
                    return false
                return true
            }
        }
        return false
    }
    hasTanyao() {
        for (let v of this.furo)
            if (!this.allowKuitan && v.length !== 2)
                return false
        let allow = ['2m', '3m', '4m', '5m', '6m', '7m', '8m', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '2s', '3s', '4s', '5s', '6s', '7s', '8s']
        return this.checkAllow(allow)
    }
    hasPinfu() {
        let res = 0
        let pinfu = false
        const r = (tmp)=>{
            for (let k in tmp) {
                for (let kk in tmp[k]) {
                    kk = parseInt(kk)
                    if (res === 4 && tmp[k][kk] === 2) {
                        return pinfu && (k < 3 || (kk <= 3 && kk !== this.bakaze-1 && kk !== this.jikaze-1))
                    }
                    if (tmp[k][kk] >= 1 && tmp[k][kk+1] >= 1 && tmp[k][kk+2] >= 1) {
                        tmp[k][kk]--
                        tmp[k][kk+1]--
                        tmp[k][kk+2]--
                        if (agari.check(tmp)) {
                            res++
                            if ((kk+1+MPSZ[k] === this.agari && kk !== 6) || (kk+3+MPSZ[k] === this.agari && kk !== 2)) {
                                pinfu = true
                            }
                            return r(tmp)
                        }
                        else {
                            tmp[k][kk]++
                            tmp[k][kk+1]++
                            tmp[k][kk+2]++
                        }
                    }
                }
            }
            return false
        }
        return r(JSON.parse(JSON.stringify(this.haiArray)))
    }
    hasYakuhai() {
        const KAZE = [undefined, '東', '南' ,'西', '北', '白', '發', '中']
        let need = [this.bakaze, this.jikaze, 5, 6, 7]
        this.yakuhai = []
        const rrrr = (n)=>{
            if (n === this.bakaze)
                this.yakuhai.push('場風' + KAZE[n])
            if (n === this.jikaze)
                this.yakuhai.push('自風' + KAZE[n])
            if (n >= 5)
                this.yakuhai.push('役牌' + KAZE[n])
        }
        for (let v of this.furo) {
            if (v[0] === v[1] && v[0].includes('z')) {
                let n = parseInt(v[0])
                rrrr(n)
            }
        }
        for (let v of this.haiArray[3])
            if (v >= 3)
                rrrr(v + 1)
        return false
    }
    hasTsumo() {
        return this.isMenzen() && this.isTsumo
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
        return this.extra && this.extra.includes('k') && this.isTsumo
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

    isCalculable() {
        return this.hai.length + this.furo.length * 3 === 14
    }

    /**
     * 門前判定
     */
    isMenzen() {
        for (let v of this.furo) {
            if (v.length > 2)
                return false
        }
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
                if (this.dora.includes(vv))
                    dora++
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
            for (let v of this.furo) {
                if (v.length === 4)
                    fu += is19(v[0]) ? 16 : 8
                if (v.length === 2)
                    fu += is19(v[0]) ? 32 : 16
                if (v.length === 3 && v[0] === v[1])
                    fu += is19(v[0]) ? 4 : 2
            }
            // todo 刻子 砍张 边张

            // 単騎+2
            let i = MPSZ.indexOf(this.agari.substr(1))
            let ii = parseInt(this.agari)-1
            if (this.haiArray[i][ii] >= 2) {
                let tmp = JSON.parse(JSON.stringify(this.haiArray))
                tmp[i][ii] -= 2
                for (let k in tmp[3])
                    if (!k)
                        k += 2
                if (agari.check(tmp))
                    fu += 2
            }

            // 雀頭+2
            if (this.haiArray[3][this.bakaze-1] === 2)
                fu += 2
            if (this.haiArray[3][this.jikaze-1] === 2)
                fu += 2
            if (this.haiArray[3][5] === 2)
                fu += 2
            if (this.haiArray[3][6] === 2)
                fu += 2
            if (this.haiArray[3][7] === 2)
                fu += 2

            // 自摸+2
            if (this.isTsumo)
                fu += 2

            fu = ceil10(fu)
            if (fu === 20)
                fu = 30
        }
        this.result.fu = fu
    }

    /**
     * 点数計算
     */
    calcTen() {
        let base
        if (this.result.yakuman) {
            base = 8000 * this.result.yakuman
            this.result.text = this.result.yakuman > 1 ? (this.result.yakuman + '倍役満') : '役満'
        } else {
            if (!this.result.han)
                return
            base = this.result.fu * Math.pow(2, this.result.han + 2)
            this.result.text = this.result.fu + '符' + this.result.han + '飜'
            if (base > 2000) {
                if (this.result.han >= 13) {
                    base = 8000
                    this.result.text += ' 数え役満'
                } else if (this.result.han >= 11) {
                    base = 6000
                    this.result.text += ' 三倍満'
                } else if (this.result.han >= 8) {
                    base = 4000
                    this.result.text += ' 倍満'
                } else if (this.result.han >= 6) {
                    base = 3000
                    this.result.text += ' 跳満'
                } else {
                    base = 2000
                    this.result.text += ' 満貫'
                }
            }
        }
        if (this.isTsumo) {
            this.result.oya = [ceil100(base*2),ceil100(base*2),ceil100(base*2)]
            this.result.ko = [ceil100(base*2),ceil100(base),ceil100(base)]
        } else {
            this.result.oya = [ceil100(base*6)]
            this.result.ko = [ceil100(base*4)]
        }
        if (this.isOya !== undefined) {
            this.result.ten = this.isOya ? eval(this.result.oya.join('+')) : eval(this.result.ko.join('+'))
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
            // console.log(method)
            if (this.disabled.includes(v) || (YAKU[v].menzenOnly && !this.isMenzen()) || !this[method]()) {
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
    disableRenho() { //人和禁止
        this.disableYaku('renhe')
    }
    disableYaku(name) { //指定役禁止
        this.disabled.push(name)
    }

    /**
     * main
     */
    calc() {
        this.result.isAgari = agari(this.haiArray)
        if (!this.result.isAgari) {
            // this.result.syanten = syanten(this.haiArray)
            // todo 牌理
            return this.result
        }
        if (!this.isCalculable()) {
            return this.result
        }
        this.calcYaku(Object.keys(YAKU))
        if (!this.result.yakuman) {
            this.calcYakuhai()
            this.calcDora()
            this.calcFu()
        }
        this.calcTen()
        return this.result
    }
}

module.exports = MJ
let mj = new MJ('11m22334455667z+7z')
console.log(mj.calc())
// console.log(mj)
