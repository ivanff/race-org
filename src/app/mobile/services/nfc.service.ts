import {Injectable, NgZone} from '@angular/core'
import {Nfc, NfcTagData} from 'nativescript-nfc'

@Injectable({
    providedIn: 'root'
})
export class NfcService {
    nfc: Nfc

    constructor(private zone: NgZone) {
        this.nfc = new Nfc()
    }

    doStartTagListener(fn: (data: NfcTagData) => any): Promise<any> {
        return this.nfc.setOnTagDiscoveredListener((data: NfcTagData) => {
            console.dir(data, this.nfc)
            console.log('Tag discovered sporttrack scan! ' + JSON.stringify(data))
            this.zone.run(() => fn(data))
        }).then(() => {
            console.log('OnTagDiscovered Listener set')
        }, (err) => {
            console.log(err)
        })
    }

    doStopTagListener() {
        this.nfc.setOnTagDiscoveredListener(null).then(() => {
            console.log('OnTagDiscovered nulled')
        }, (err) => {
            console.log(err)
        })
    }
}
