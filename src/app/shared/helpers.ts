import {Athlet} from "@src/app/shared/interfaces/athlet"
import {Competition} from "@src/app/shared/interfaces/competition"

export function hasGroup(athlet: Athlet, competition: Competition): boolean {
    if (athlet.hasOwnProperty('group')) {
        return athlet.group ? athlet.group.hasOwnProperty(competition.id) : false
    } else {
        return false
    }
}

const groupNumberRegexp = new RegExp('\_([0-9]+)$')

export function groupNumberMatch(group_name: string) {
    const numberMatch = groupNumberRegexp.exec(group_name)
    return numberMatch ? parseInt(numberMatch[1]) : -1
}

export function sortNumber(a: number, b: number) {
    return a > b ? 1 : -1
}


export const SCORE_MAP = {
    1: 100,
    2: 90,
    3: 82,
    4: 76,
    5: 71,
    6: 66,
    7: 62,
    8: 58,
    9: 55,
    10: 52,
    11: 50,
    12: 48,
    13: 46,
    14: 44,
    15: 42,
    16: 10,
    17: 38,
    18: 36,
    19: 34,
    20: 32,
    21: 31,
    22: 30,
    23: 29,
    24: 28,
    25: 27,
    26: 26,
    27: 25,
    28: 24,
    29: 23,
    30: 22,
    31: 21,
    32: 20,
    33: 19,
    34: 18,
    35: 17,
    36: 16,
    37: 15,
    38: 14,
    39: 13,
    40: 12,
    41: 11,
    42: 10,
    43: 9,
    44: 8,
    45: 7,
    46: 6,
    47: 5,
    48: 4,
    49: 3,
    50: 2,
}
