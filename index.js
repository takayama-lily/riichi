/*
 * Copyright (C) https://github.com/takayama-lily/riichi
 */
'use strict'
const agari = require('agari')
const syanten = require('syanten')
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
        this.agariPatterns = []
        this.currentPattern
        this.tmpResult = { //臨時計算結果
            'isAgari': false, //和了?
            'yakuman': 0, //役満倍数
            'yaku': {}, //手役 例:{'天和':'役満','大四喜':'ダブル役満'} 例:{'立直':'1飜','清一色':'6飜'}
            'han': 0, //飜数
            'fu': 0, //符数
            'ten': 0, //点数(this.isOya=undefined場合，計算不能)
            'name': '', //例:'満貫'、'跳満'、'倍満'、'三倍満'、'数え役満'
            'text': '', //結果text 例:'30符4飜'、'40符4飜 満貫'、'6倍役満'
            'oya': [0, 0, 0], //親家得点 例:[2600,2600,2600]、[7700]
            'ko': [0, 0, 0], //子家得点 例:[3900,2000,2000]、[7700]
            'error': true //input error
        }
        this.finalResult //最終計算結果

        this.allLocalEnabled = false //全部local役許可
        this.localEnabled = [] //local役許可list
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

        if (this.hai.length % 3 === 0)
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

        this.tmpResult.error = false
        this.finalResult = JSON.parse(JSON.stringify(this.tmpResult))
    }

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
     * dora枚数計算
     */
    calcDora() {
        if (!this.tmpResult.han)
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
            this.tmpResult.han += dora
            this.tmpResult.yaku['ドラ'] = dora + '飜'
        }
        if (this.allowAka && this.aka) {
            this.tmpResult.han += this.aka
            this.tmpResult.yaku['赤ドラ'] = this.aka + '飜'
        }
    }

    /**
     * 符計算
     */
    calcFu() { 
        let fu = 0
        if (this.tmpResult.yaku['七対子']) {
            fu = 25
        } else if (this.tmpResult.yaku['平和']) {
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
        this.tmpResult.fu = fu
    }

    /**
     * 点数計算
     */
    calcTen() {
        this.tmpResult.name = ''
        let base
        this.tmpResult.text = `(${KAZE[this.bakaze]}場`
        this.tmpResult.text += KAZE[this.jikaze] + '家)'
        this.tmpResult.text += this.isTsumo ? '自摸' : '栄和'
        if (this.tmpResult.yakuman) {
            base = 8000 * this.tmpResult.yakuman
            this.tmpResult.name = this.tmpResult.yakuman > 1 ? (this.tmpResult.yakuman + '倍役満') : '役満'
        } else {
            if (!this.tmpResult.han)
                return
            base = this.tmpResult.fu * Math.pow(2, this.tmpResult.han + 2)
            this.tmpResult.text += ' ' + this.tmpResult.fu + '符' + this.tmpResult.han + '飜'
            if (base > 2000) {
                if (this.tmpResult.han >= 13) {
                    base = 8000
                    this.tmpResult.name = '数え役満'
                } else if (this.tmpResult.han >= 11) {
                    base = 6000
                    this.tmpResult.name = '三倍満'
                } else if (this.tmpResult.han >= 8) {
                    base = 4000
                    this.tmpResult.name = '倍満'
                } else if (this.tmpResult.han >= 6) {
                    base = 3000
                    this.tmpResult.name = '跳満'
                } else {
                    base = 2000
                    this.tmpResult.name = '満貫'
                }
            }
        }
        this.tmpResult.text += (this.tmpResult.name ? ' ' : '') + this.tmpResult.name
        if (this.isTsumo) {
            this.tmpResult.oya = [ceil100(base*2),ceil100(base*2),ceil100(base*2)]
            this.tmpResult.ko = [ceil100(base*2),ceil100(base),ceil100(base)]
        } else {
            this.tmpResult.oya = [ceil100(base*6)]
            this.tmpResult.ko = [ceil100(base*4)]
        }
        this.tmpResult.ten = this.isOya ? eval(this.tmpResult.oya.join('+')) : eval(this.tmpResult.ko.join('+'))
        this.tmpResult.text += ' ' + this.tmpResult.ten + '点'
        if (this.isTsumo) {
            this.tmpResult.text += '('
            if (this.isOya)
                this.tmpResult.text += this.tmpResult.oya[0] + 'all'
            else
                this.tmpResult.text += this.tmpResult.ko[0] + ',' + this.tmpResult.ko[1]
            this.tmpResult.text += ')'
        }

    }

    /**
     * 手役計算
     */
    calcYaku() {
        this.tmpResult.yaku = {}
        this.tmpResult.yakuman = 0
        this.tmpResult.han = 0
        for (let k in YAKU) {
            let v = YAKU[k]
            if (this.disabled.includes(k))
                continue
            if (v.isLocal && !this.allLocalEnabled && !this.localEnabled.includes(k))
                continue
            if (this.tmpResult.yakuman && !v.yakuman)
                continue
            if (v.isMenzenOnly && !this.isMenzen())
                continue
            if (v.check(this)) {
                if (v.yakuman) {
                    let n = this.allowWyakuman ? v.yakuman : 1
                    this.tmpResult.yakuman += n
                    this.tmpResult.yaku[k] = n > 1 ? 'ダブル役満' : '役満'
                } else {
                    let n = v.han
                    if (v.isFuroMinus && !this.isMenzen())
                        n--
                    this.tmpResult.yaku[k] = n + '飜'
                    this.tmpResult.han += n
                }
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
    enableLocalYaku(name) { //指定local役有効
        this.localEnabled.push(name)
    }
    disableYaku(name) { //指定役禁止
        this.disabled.push(name)
    }

    // supported local yaku list
    // 大七星 役満(字一色別)
    // 人和 役満
    // 

    /**
     * main
     */
    calc() {
        if (this.tmpResult.error) {
            return this.tmpResult
        }
        this.tmpResult.isAgari = agari.checkAll(this.haiArray)
        if (!this.tmpResult.isAgari || this.hai.length + this.furo.length * 3 !== 14) {
            this.tmpResult.syanten = syanten.hairi(this.haiArray)
            return this.tmpResult
        }

        this.finalResult.isAgari = true
        if (this.extra.includes('o'))
            this.allLocalEnabled = true
        
        this.agariPatterns = agari(this.haiArray)
        if (!this.agariPatterns.length)
            this.agariPatterns.push([])
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
            this.currentPattern = v.concat(this.furo)
            this.calcYaku()
            if (!this.tmpResult.yakuman && !this.tmpResult.han)
                continue
            if (this.tmpResult.han) {
                this.calcDora()
                this.calcFu()
            }
            this.calcTen()
            if (this.tmpResult.ten > this.finalResult.ten)
                this.finalResult = JSON.parse(JSON.stringify(this.tmpResult))
            else if (this.tmpResult.ten === this.finalResult.ten && this.tmpResult.han > this.finalResult.han)
                this.finalResult = JSON.parse(JSON.stringify(this.tmpResult))
        }

        if (!this.finalResult.ten)
            this.finalResult.text = '無役'
        return this.finalResult
    }
}
module.exports = Riichi
