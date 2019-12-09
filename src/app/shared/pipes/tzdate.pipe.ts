import {Pipe} from '@angular/core'
import * as moment from "moment-timezone"
import {DatePipe} from "@angular/common"
import {Competition} from "@src/app/shared/interfaces/competition"
import {device} from "tns-core-modules/platform"

const postSolietLangs = [
    'ru',
    'be',
    'uk',
]

@Pipe({
    name: 'tzdate'
})
export class TzDatePipe extends DatePipe {
    transform(value: any, format = 'mediumDate', timezone?: string, locale?: string): string {
        return super.transform(value, format, timezone ? moment.tz(timezone).format('ZZ') : null, locale ? locale : device.language)
    }
}

@Pipe({
    name: 'tzdateStart'
})
export class TzDateStartPipe extends DatePipe {
    transform(competition: Competition, timezone?: string, locale?: string): string {
        const date = moment.tz(
            `${moment(competition.end_date).format('YYYY-MM-DD')}T00:00:00`, competition.timezone
        ).add(competition.start_time, 's')

        let format = "yyyy-MM-dd HH:mm:ss z"

        if (postSolietLangs.indexOf(device.language) > -1) {
            format = "dd.MM.yyyy HH:mm:ss z"
        }

        return super.transform(date.toDate(), format,timezone ? moment.tz(timezone).format('ZZ') : null, locale)
    }
}

@Pipe({
    name: 'tzdateFinish'
})
export class TzDateFinishPipe extends DatePipe {
    transform(competition: Competition, timezone?: string, locale?: string): string {
        const date = moment.tz(
            `${moment(competition.start_date).format('YYYY-MM-DD')}T00:00:00`, competition.timezone
        ).add(competition.start_time + competition.duration, 's')

        let format = "yyyy-MM-dd HH:mm:ss z"

        if (postSolietLangs.indexOf(device.language) > -1) {
            format = "dd.MM.yyyy HH:mm:ss z"
        }

        return super.transform(date.toDate(), format, timezone ? moment.tz(timezone).format('ZZ') : null, locale)
    }
}
