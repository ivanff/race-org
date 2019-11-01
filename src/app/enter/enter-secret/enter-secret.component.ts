import {Component, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output} from '@angular/core'
import {Page} from "tns-core-modules/ui/page"
import {AuthService} from "@src/app/mobile/services/auth.service"
import {TextField} from "tns-core-modules/ui/text-field"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {BarcodeScanner} from "nativescript-barcodescanner"
import {Competition} from "@src/app/shared/interfaces/competition"
import {device} from "tns-core-modules/platform"
import {MobileDevice} from "@src/app/shared/interfaces/mobile-device"
import {getNumber, setNumber} from "tns-core-modules/application-settings"
import {firestore} from "nativescript-plugin-firebase"

const barcodescanner = new BarcodeScanner()
const firebase = require('nativescript-plugin-firebase/app')

@Component({
    selector: 'app-enter-secret',
    templateUrl: './enter-secret.component.html',
})
export class EnterSecretComponent implements OnInit, OnDestroy {
    code: number = getNumber('code')

    @Input() pending: boolean = false
    @Output() setPending = new EventEmitter<boolean>()

    constructor(private page: Page,
                private zone: NgZone,
                private _competition: CompetitionService,
                public auth: AuthService) {
    }

    ngOnInit() {
    }

    ngOnDestroy(): void {
    }

    getCode() {
        return this.code
    }

    onCodeChange($event): void {
        const textField = <TextField>$event.object
        this.code = parseInt(textField.text) || null
    }

    onCodeLogin(): void {
        this.setPending.emit(true)
        this._competition.getByCode(this.code).then((docs: { [key: string]: Array<firestore.QueryDocumentSnapshot> }) => {
            let competition: Competition

            for (const key in docs) {
                if (docs[key].length) {
                    setNumber('code', this.code)
                    const id = docs[key][0].id

                    competition = {id, ...docs[key][0].data()} as Competition
                    if (!competition.mobile_devices.filter((item: MobileDevice) => item.uuid == device.uuid).length) {
                        competition.mobile_devices.push({
                            uuid: device.uuid,
                            deviceType: device.deviceType,
                            osVersion: device.osVersion,
                            model: device.model,
                            isAdmin: key == 'admins'
                        } as MobileDevice)
                        this._competition.update(competition, {
                            'mobile_devices': competition.mobile_devices
                        }).then(() => {
                            this.selectCompetition(competition)
                        }).catch(() => {
                            this.setPending.emit(false)
                        })
                    } else {
                        this.selectCompetition(competition)
                    }
                    break
                }
            }
            if (!competition) {
                throw Error("Not found any competition")
            }
        }).catch(() => {
            this.setPending.emit(false)
        })
    }

    private selectCompetition(competition: Competition | null): void {
        if (!this.auth.user) {
            this.auth.anonymousLogin().then(() => {
                this._competition.selected_competition_id$.next(competition)
                this.setPending.emit(false)
            })
        } else {
            this._competition.selected_competition_id$.next(competition)
            this.setPending.emit(false)
        }
    }

    onScan(): void {
        barcodescanner.scan({
            formats: "QR_CODE",
            showFlipCameraButton: true,   // default false
            preferFrontCamera: false,     // default false
            showTorchButton: true,        // default false
            beepOnScan: true,             // Play or Suppress beep on scan (default true)
            torchOn: false,               // launch with the flashlight on (default false)
            closeCallback: () => {
                console.log("Scanner closed")
            },
            resultDisplayDuration: 500,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text
            openSettingsIfPermissionWasPreviouslyDenied: true, // On iOS you can send the user to the settings app if access was previously denied
            // presentInRootViewController: true // iOS-only; If you're sure you're not presenting the (non embedded) scanner in a modal, or are experiencing issues with fi. the navigationbar, set this to 'true' and see if it works better for your app (default false).
        }).then((result) => {
                this.code = parseInt(result.text) || null
                this.onCodeLogin()
                alert({
                    title: "Scan result",
                    message: "Format: " + result.format + ",\nValue: " + result.text,
                    okButtonText: "OK"
                });
            }, (errorMessage) => {
                console.log("No scan. " + errorMessage);
            }
        );
    }

}
