import {Pipe, PipeTransform} from '@angular/core'
import {MobileDevice} from "@src/app/shared/interfaces/mobile-device"
import {Competition} from "@src/app/shared/interfaces/competition"

@Pipe({
    name: 'getDevice'
})
export class GetDevicePipe implements PipeTransform {
    transform(uuid: string, competition: Competition): MobileDevice | null {
        const mobile_devices: MobileDevice[] = competition.mobile_devices.filter((item: MobileDevice) => item.uuid == uuid)
        if (mobile_devices.length == 1) {
            return mobile_devices[0]
        }
        return null
    }
}
