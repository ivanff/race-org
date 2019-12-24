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
