import {Injectable, NgZone} from '@angular/core'
import {BarcodeScanner} from "nativescript-barcodescanner"

@Injectable({
    providedIn: 'root'
})
export class BarcodeService {
    private barcodescanner: BarcodeScanner

    constructor(private zone: NgZone) {
        this.barcodescanner = new BarcodeScanner()
    }

    scan(): Promise<any> {
        return this.barcodescanner.scan({
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
        })
    }

}
