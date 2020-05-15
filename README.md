# **Riichi**

麻雀飜符手役点数計算  
Japanese riichi mahjong hand calculation

**Install with npm:**

```
$ npm i riichi
```

## Usage

```js
const Riichi = require('riichi')
const riichi = new Riichi('112233456789m11s')
console.log(riichi.calc())
```

Output:

```js
{
  isAgari: true,
  yakuman: 0,
  yaku: { '一気通貫': '2飜', '一盃口': '1飜', '門前清自摸和': '1飜' },
  han: 4,
  fu: 30,
  ten: 7900,
  name: '',
  text: '(東場南家)自摸 30符4飜 7900点(3900,2000)',
  oya: [ 3900, 3900, 3900 ],
  ko: [ 3900, 2000, 2000 ],
  error: false
}
```

"m,p,s,z" means "萬子,筒子,索子,字牌"  
"1z-7z" means "東南西北白發中"
"0m" means "赤5萬"

**自摸 & 栄和:**

```js
new Riichi('112233456789m1s1s') //自摸
new Riichi('112233456789m1s+1s') //栄和
```

**副露:**

```js
new Riichi('1s+1s+123m55z666z7777z') //副露:123m順子 5z暗槓 6z明刻 7z明槓
```

**Dora:**

```js
new Riichi('112233456789m1s1s+d12s') //Dora: 1s 2s
```

**Extra Option:**

```js
new Riichi('1s+1s+123m55z666z7777z+d12s+trihk22') //Extra:trihk22
```

| Option | Meaning |
| --- | --- |
| t | 天和/地和/人和 |
| r(l) | 立直 |
| i(y) | 一発 |
| w | w立直 |
| h | 海底摸月/河底撈魚 |
| k | 槍槓/嶺上開花 |
| o | 全local役有効 |
| 22 | 場風南自風南 |

**場風自風:**

1234=東南西北  
default: 場風東自風南

```js
new Riichi('112233456789m1s1s+1') //(場風東)自風東
new Riichi('112233456789m1s1s+21') //場風南自風東
new Riichi('112233456789m1s1s+24') //場風南自風北
```

**local yaku list:**
| Name | 飜数 |
| --- | --- |
| 人和 | 役満x1 |
| 大七星 | 役満x1 |

## Api

- [Class: Riichi](#Usage)
  - [riichi.calc()](#Usage)
  - [riichi.disableWyakuman()](#use-before-calc)
  - [riichi.disableKuitan()](#use-before-calc)
  - [riichi.disableAka()](#use-before-calc)
  - [riichi.enableLocalYaku(name)](#use-before-calc)
  - [riichi.disableYaku(name)](#use-before-calc)

### use-before-calc()

```js
const Riichi = require('riichi')
const riichi = new Riichi('112233456789m11s+o')

riichi.disableWyakuman() //2倍役満禁止
riichi.disableKuitan() //喰断禁止
riichi.disableAka() //赤dora禁止
riichi.enableLocalYaku('人和') //人和有効
riichi.disableYaku('大七星') //大七星禁止

let result = riichi.calc()
```

# 向聴数牌理計算 [lib](https://github.com/takayama-lily/syanten)

```js
console.log(new Riichi('111222333m11p123z').calc())
```

**Output**

```js
{
  ...
  hairi: {
    now: 1, //現在向聴数
    '1m': {},
    '2m': {},
    '3m': {},
    '1p': {},
    '1z': { '1p': 2, '2z': 3, '3z': 3 }, //打1z 待1p二枚 2z三枚 3z三枚
    '2z': { '1p': 2, '1z': 3, '3z': 3 }, //打2z 待1p二枚 1z三枚 3z三枚
    '3z': { '1p': 2, '1z': 3, '2z': 3 }  //打3z 待1p二枚 1z三枚 2z三枚
  }
}
```
