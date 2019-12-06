import {Pipe} from '@angular/core'
import * as moment from "moment-timezone"
import {DatePipe} from "@angular/common"

@Pipe({
    name: 'tzdate'
})
export class TzDatePipe extends DatePipe {
    transform(value: any, format = 'mediumDate', timezone?: string, locale?: string): string {
        return super.transform(value, format, moment.tz(timezone).format('ZZ'), locale)
    }
}
