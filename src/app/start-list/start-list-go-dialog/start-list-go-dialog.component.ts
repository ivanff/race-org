import {
    Component
} from '@angular/core'
import {ModalDialogParams} from "nativescript-angular"
import {DialogComponent} from "@src/app/shared/dialog.component"
import {BehaviorSubject, Observable, ReplaySubject, timer} from "rxjs"
import {filter, map, takeUntil, takeWhile, withLatestFrom} from "rxjs/operators"


const TIMER_COUNT = 5


@Component({
    selector: 'app-start-list-go-dialog',
    templateUrl: './start-list-go-dialog.component.html',
    styleUrls: ['./start-list-go-dialog.component.scss']
})
export class StartListGoDialogComponent extends DialogComponent {
    private destroy = new ReplaySubject<any>(1)
    private timer$: Observable<number>
    private unsubscriber: any
    private pause$ = new BehaviorSubject<boolean>(false)
    private start_time: Date
    stop = false
    timer = TIMER_COUNT

    constructor(public _params: ModalDialogParams) {
        super(_params)
        this.timer$ = timer(0, 1000).pipe(
            withLatestFrom(this.pause$),
            filter(([i, paused]) => !paused),
            map(([i, paused]) => {
                if (i && this.timer > 0)
                    this.timer -= 1
                return this.timer
            }),
            takeWhile((i) => {
                return i >= 0
            }),
            takeUntil(this.destroy),
        )
        this.pause$.subscribe((next) => {
            this.stop = next
        })
    }

    onStart(): void {
        this.pause$.next(false)
        this.unsubscriber = this.timer$.subscribe((next) => {
            if (!next) {
                this.start_time = new Date()

                setTimeout(() => {
                    this.onClose()
                }, 2000)
            }
        })
    }

    onPause(): void {
        this.pause$.next(!this.stop)
    }

    onReset(): void {
        this.timer = TIMER_COUNT
        if (this.unsubscriber) {
            this.unsubscriber.unsubscribe()
        }
    }

    ngOnDestroy(): void {
        super.ngOnDestroy()
        this.destroy.next(null)
        this.destroy.complete()
    }

    onClose(args?: any): void {
        super.onClose({
            start_time: this.start_time
        });
    }
}
