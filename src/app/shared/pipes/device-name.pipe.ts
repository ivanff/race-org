import {Pipe, PipeTransform} from '@angular/core'
import {MobileDevice} from "@src/app/shared/interfaces/mobile-device"

@Pipe({
    name: 'deviceName'
})
export class DeviceNamePipe implements PipeTransform {
    transform(item: MobileDevice): string {
      return item.model || `${item.deviceType} ОС: ${item.osVersion}`
    }
}
