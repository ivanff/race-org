import {Athlet} from "@src/app/shared/interfaces/athlet"
import {Competition} from "@src/app/shared/interfaces/competition"

export function hasGroup(athlet: Athlet, competition: Competition): boolean {
    if (athlet.hasOwnProperty('group')) {
        return athlet.group ? athlet.group.hasOwnProperty(competition.id) : false
    } else {
        return false
    }
}
