import {Component, NgZone, OnDestroy, OnInit} from '@angular/core'
import {Page} from "tns-core-modules/ui/page"
import {AuthService} from "@src/app/mobile/services/auth.service"
import {TextField} from "tns-core-modules/ui/text-field"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {BarcodeScanner} from "nativescript-barcodescanner"
import * as firebase from 'nativescript-plugin-firebase'

const barcodescanner = new BarcodeScanner()


@Component({
    selector: 'app-enter-secret',
    templateUrl: './enter-secret.component.html',
})
export class EnterSecretComponent implements OnInit, OnDestroy {
    code: number = 451765

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
        this._competition.getByCode(this.code).then((docs: Array<firebase.firestore.QueryDocumentSnapshot>) => {
            if (docs.length) {
                console.log('onCodeLogin')
                // выполняется не всегда!
                // const competition = {...docs[0].data()} as Competition
                // competition.id = docs[0].id
                if (!this.auth.user) {
                    this.auth.anonymousLogin().then(() => {
                        this._competition.selected_competition_id$.next(docs[0].id)
                    })
                }
            }
        })
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
