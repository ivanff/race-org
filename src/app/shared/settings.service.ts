import {Injectable, OnDestroy} from '@angular/core'

@Injectable({
    providedIn: 'root'
})
export class SettingsService implements OnDestroy {
    constructor() {
    }

    ngOnDestroy(): void {
    }
}
