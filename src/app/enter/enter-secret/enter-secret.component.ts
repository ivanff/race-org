import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core'
import {AuthService} from "@src/app/mobile/services/auth.service"
import {TextField} from "@nativescript/core/ui/text-field"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {Competition} from "@src/app/shared/interfaces/competition"
import {getNumber, setNumber} from "@nativescript/core/application-settings"
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
                })
            })
        } else {
            this.selectCompetition(this.code).then((competition: Competition) => {
                this._competition.selected_competition_id$.next(competition)
            })
        }
    }

    private selectCompetition(code: number): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this._competition.getByCode(code).subscribe((competition) => {
                setNumber('code', code)
                resolve(competition)
            }, reject)
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
