'use strict'
module.exports = 
{
  '国士無双十三面待ち': { yakuman: 2, menzenOnly: true, check: [Function] },
  '国士無双': { yakuman: 1, menzenOnly: true, check: [Function] },
  '純正九蓮宝燈': { yakuman: 2, menzenOnly: true, check: [Function] },
  '九蓮宝燈': { yakuman: 1, menzenOnly: true, check: [Function] },
  '四暗刻単騎待ち': { yakuman: 2, menzenOnly: true, check: [Function] },
  '四暗刻': { yakuman: 1, menzenOnly: true, check: [Function] },
  '大四喜': { yakuman: 2, check: [Function] },
  '小四喜': { yakuman: 1, check: [Function] },
  '大三元': { yakuman: 1, check: [Function] },
  '字一色': { yakuman: 1, check: [Function] },
  '緑一色': { yakuman: 1, check: [Function] },
  '清老頭': { yakuman: 1, check: [Function] },
  '四槓子': { yakuman: 1, check: [Function] },
  '天和': { yakuman: 1, menzenOnly: true, check: [Function] },
  '地和': { yakuman: 1, menzenOnly: true, check: [Function] },
  '人和': { yakuman: 1, menzenOnly: true, check: [Function] },
  '七対子': { han: 2, menzenOnly: true, check: [Function] },
  '清一色': { han: 5, 'menzen+1': true, check: [Function] },
  '混一色': { han: 2, 'menzen+1': true, check: [Function] },
  '三色同刻': { han: 2, check: [Function] },
  '二盃口': { han: 3, menzenOnly: true, check: [Function] },
  '対々和': { han: 2, check: [Function] },
  '混老頭': { han: 2, check: [Function] },
  '三槓子': { han: 2, check: [Function] },
  '小三元': { han: 2, check: [Function] },
  '純全帯么九': { han: 2, 'menzen+1': true, check: [Function] },
  '混全帯么九': { han: 1, 'menzen+1': true, check: [Function] },
  '一気通貫': { han: 1, 'menzen+1': true, check: [Function] },
  '三色同順': { han: 1, 'menzen+1': true, check: [Function] },
  '三暗刻': { han: 2, check: [Function] },
  '役牌': { han: 1, check: [Function] },
  '断么九': { han: 1, check: [Function] },
  '平和': { han: 1, menzenOnly: true, check: [Function] },
  '一盃口': { han: 1, menzenOnly: true, check: [Function] },
  'ダブル立直': { han: 2, menzenOnly: true, check: [Function] },
  '立直': { han: 1, menzenOnly: true, check: [Function] },
  '一発': { han: 1, menzenOnly: true, check: [Function] },
  '嶺上開花': { han: 1, check: [Function] },
  '搶槓': { han: 1, check: [Function] },
  '海底摸月': { han: 1, check: [Function] },
  '河底撈魚': { han: 1, check: [Function] },
  'ドラ': { han: 1, check: [Function] },
  '赤ドラ': { han: 1, check: [Function] },
  '門前清自摸和': { han: 1, menzenOnly: true, check: [Function] }
}

let res = {}
for (let k in module.exports) {
    res[k] = {}
    for (let kk in module.exports[k]) {
        if (kk === 'coexist' || kk === 'name')
            continue
        res[k][kk] = module.exports[k][kk]
    }
    res[k].check = ()=>{}
}

console.log(res)