import {Pipe, PipeTransform} from '@angular/core'
import {MobileDevice} from "@src/app/shared/interfaces/mobile-device"

@Pipe({
    name: 'join'
})
export class JoinPipe implements PipeTransform {
    transform(list: Array<any>, sep?: string): string {
        return list.join(sep || ', ')
    }
}
