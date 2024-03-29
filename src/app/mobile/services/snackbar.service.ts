import {Injectable, OnDestroy} from '@angular/core'
import {SnackBar, SnackBarOptions} from "@nstudio/nativescript-snackbar"
import {defer, Subject} from "rxjs"
import {concatMap} from "rxjs/operators"
import {Msg} from "@src/app/shared/interfaces/msg"
import {localize as L} from "nativescript-localize"
import {confirm as confirm_dialog} from "@nativescript/core/ui/dialogs"

@Injectable({
    providedIn: 'root'
})
export class SnackbarService implements OnDestroy {
    private snackbar = new SnackBar()
    snackbar$: any

    constructor() {
        this.snackbar$ = (new Subject).pipe(
            concatMap((value: Msg) => {
                    return defer(() => {
                        if (value.level == 'alert') {
                            return this.alert(value.msg, value.timeout || null)
                        } else if (value.level == 'success') {
                            return this.success(value.msg, value.timeout || null)
                        } else if (value.level == 'warning') {
                            return this.warning(value.msg, value.timeout || null)
                        }
                    })
                }
            )
        )
        this.snackbar$.subscribe()
    }

    ngOnDestroy(): void {
    }

    alert(msg: string, timeout?: number): Promise<any> | null {
        if (msg) {
            return this.snackbar.action({
                snackText: msg,
                hideDelay: timeout || 3000,
                textColor: '#fff',
                backgroundColor: '#d50000',
                maxLines: 3,
            } as SnackBarOptions)
        }
        return null
    }

    success(msg: string, timeout?: number): Promise<any> | null {
        if (msg) {
            return this.snackbar.action({
                snackText: msg,
                hideDelay: timeout || 2000,
                textColor: '#fff',
                backgroundColor: '#00caab',
                maxLines: 3,
            } as SnackBarOptions)
        }
        return null
    }

    warning(msg: string, timeout?: number): Promise<any> | null {
        if (msg) {
            return this.snackbar.action({
                snackText: msg,
                hideDelay: timeout || 2000,
                textColor: '#fff',
                backgroundColor: '#f57c00',
                maxLines: 3,
            } as SnackBarOptions)
        }
        return null
    }

    confirm(msg: string, title?: string): Promise<boolean> {
        const options = {
            title: title ? title : L("Are you sure?"),
            message: msg,
            okButtonText: L('Yes'),
            cancelButtonText: L('No'),
        }
        return confirm_dialog(options)
    }

}
