import {Component, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output} from '@angular/core'
import {AuthService} from "@src/app/mobile/services/auth.service"
import {TextField} from "tns-core-modules/ui/text-field"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {Competition} from "@src/app/shared/interfaces/competition"
import {device} from "tns-core-modules/platform"
import {MobileDevice} from "@src/app/shared/interfaces/mobile-device"
import {getNumber, setNumber} from "tns-core-modules/application-settings"
import {BarcodeService} from "@src/app/mobile/services/barcode.service"
import {SnackbarService} from "@src/app/mobile/services/snackbar.service"
import {localize as L} from "nativescript-localize"

@Component({
    selector: 'app-enter-secret',
    templateUrl: './enter-secret.component.html',
})
export class EnterSecretComponent implements OnInit, OnDestroy {
    code: number = getNumber('code')

    @Input() pending: boolean = false
    @Output() setPending = new EventEmitter<boolean>()

    constructor(private barcode: BarcodeService,
                private snackbar: SnackbarService,
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
        if (!this.auth.user) {
            this.auth.anonymousLogin().then(() => {
                this.selectCompetition(this.code).then((competition: Competition) => {
                    this._competition.selected_competition_id$.next(competition)
                }).catch((err) => {
                    if (err) {
                        if (err.error) {
                            if (err.error.message) {
                                this.snackbar.alert(err.error.message)
                            } else {
                                this.snackbar.alert(err.error)
                            }
                        }
                    }
                    this.auth.logout()
                }).finally(() => {
                    this.setPending.emit(false)
                })
            })
        } else {
            this.selectCompetition(this.code).then((competition: Competition) => {
                this._competition.selected_competition_id$.next(competition)
            }).catch((err) => {
                if (err) {
                    if (err.error) {
                        if (err.error.message) {
                            this.snackbar.warning(err.error.message)
                        } else {
                            this.snackbar.alert(err.error)
                        }
                    }
                }
            }).finally(() => {
                this.setPending.emit(false)
            })
        }
    }

    private selectCompetition(code: number): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this._competition.getByCode(code).subscribe((next) => {
                setNumber('code', code)
                const competition = next.competition
                if (!competition.mobile_devices.filter((item: MobileDevice) => item.uuid == device.uuid).length) {
                    competition.mobile_devices.push({
                        uuid: device.uuid,
                        deviceType: device.deviceType,
                        osVersion: device.osVersion,
                        model: device.model,
                        isAdmin: next.role == 'admin'
                    } as MobileDevice)
                    this._competition.update(competition, {
                        mobile_devices: competition.mobile_devices
                    }).then((data) => {
                        resolve(data)
                    })
                } else {
                    resolve(competition)
                }

            }, reject)
        })
    }

    onScan(): void {
        this.barcode.scan().then((result) => {
                this.code = parseInt(result.text) || null
                this.onCodeLogin()
            }, (errorMessage) => {
                this.snackbar.alert(L("Вarcode scan error: %s", errorMessage))
            }
        )
    }
}
