import {Pipe, PipeTransform} from '@angular/core'
import {MobileDevice} from "@src/app/shared/interfaces/mobile-device"
import {Athlet} from "@src/app/shared/interfaces/athlet"

@Pipe({
    name: 'hasGroup'
})
export class HasGroupPipe implements PipeTransform {
    transform(athlets: Array<Athlet>, check: boolean): Array<Athlet> {
        return athlets.filter((athlet: Athlet) => check ? athlet : !athlet.group )
    }
}
