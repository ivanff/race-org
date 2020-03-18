import {Pipe} from '@angular/core'
import * as moment from "moment-timezone"
import {DatePipe} from "@angular/common"
import {Competition} from "@src/app/shared/interfaces/competition"

const postSovietLangs = [
    'ru',
    'be',
    'uk',
]

function getLocale(locale?) {
    if (locale) {
        return postSovietLangs.indexOf(locale) > -1 ? 'ru' : null
    } else {
        if (['ru', 'ru-RU'].indexOf(window.navigator.language) >= 0) {
            return 'ru'
        }
    }
    return null
}


@Pipe({
    name: 'tzdate'
})
export class TzDatePipe extends DatePipe {
    transform(value: any, format = 'mediumDate', timezone?: string, locale?: string): string {
        return super.transform(value, format, timezone ? moment.tz(timezone).format('ZZ') : null, getLocale(locale))
    }
}

@Pipe({
    name: 'tzdateStart'
})
export class TzDateStartPipe extends DatePipe {
    transform(competition: Competition, timezone?: string, locale?: string): string {
        const date = moment.tz(
            `${moment(competition.start_date.toMillis()).format('YYYY-MM-DD')}T00:00:00`, competition.timezone
        ).add(competition.start_time, 's')
        const format = getLocale(locale) == 'ru' ? "dd.MM.yyyy HH:mm:ss z" : "yyyy-MM-dd HH:mm:ss z"
        return super.transform(date.toDate(), format,timezone ? moment.tz(timezone).format('ZZ') : null, getLocale(locale))
    }
}

@Pipe({
    name: 'tzdateFinish'
})
export class TzDateFinishPipe extends DatePipe {
    transform(competition: Competition, timezone?: string, locale?: string): string {
        const date = moment.tz(
            `${moment(competition.start_date.toMillis()).format('YYYY-MM-DD')}T00:00:00`, competition.timezone
        ).add(competition.start_time + competition.duration, 's')
        const format = getLocale(locale) == 'ru' ? "dd.MM.yyyy HH:mm:ss z" : "yyyy-MM-dd HH:mm:ss z"
        return super.transform(date.toDate(), format, timezone ? moment.tz(timezone).format('ZZ') : null, getLocale(locale))
    }
}
