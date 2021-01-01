declare class Riichi {
    constructor(str: string);

    // disable 二倍役満
    disableWyakuman(): void;

    // disable 喰断
    disableKuitan(): void;

    // disable 赤dora
    disableAka(): void;

    // disable calculate 牌理 (未和了の場合)
    disableHairi(): void;

    enableLocalYaku(name: "大七星" | "人和"): void;
    disableYaku(name: string): void;

    calc(): Riichi.Result;
}

declare namespace Riichi {
    interface Result {
        isAgari: boolean,
        yakuman: number,
        yaku: { [k: string]: string },
        han: number,
        fu: number,
        ten: number,
        name: string,
        text: string,
        oya: [number, number, number],
        ko: [number, number, number],
        error: boolean,
        hairi?: any,
        hairi7and13?: any,
    }
}

export = Riichi;
