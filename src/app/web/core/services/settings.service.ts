import {Injectable} from '@angular/core'
import {Observable, Subject} from 'rxjs'
import {AppSettings, defaults} from '../settings'
import timezones from 'google-timezones-json'

@Injectable({
    providedIn: 'root',
})
export class SettingsService {
    private notice$ = new Subject<any>();
    private options = defaults;

    timezones: {[key: string]: string} = timezones

    get notice(): Observable<any> {
        return this.notice$.asObservable();
    }

    setLayout(options?: AppSettings): AppSettings {
        this.options = Object.assign(defaults, options);
        return this.options;
    }

    setNavState(type: string, value: boolean) {
        this.notice$.next({type, value} as any);
    }

    getOptions(): AppSettings {
        return this.options;
    }

}
