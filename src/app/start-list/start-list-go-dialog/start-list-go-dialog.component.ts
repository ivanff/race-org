import {
    Component
} from '@angular/core'
import {ModalDialogParams} from "nativescript-angular"
import {DialogComponent} from "@src/app/shared/dialog.component"
import {BehaviorSubject, Observable, ReplaySubject, timer} from "rxjs"
import {filter, map, takeUntil, takeWhile, withLatestFrom} from "rxjs/operators"
import {environment} from "@src/environments/environment"
import {TNSPlayer} from 'nativescript-audio'

const TIMER_COUNT = environment.production ? 15 : 5


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
    private player: TNSPlayer = new TNSPlayer()

    stop = false
    timer = TIMER_COUNT

    constructor(public _params: ModalDialogParams) {
        super(_params)
        this.player.initFromFile({
            audioFile: "~/assets_mobile/sounds/alarm_clock.mp3",
            loop: false
        })

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
        if (this.unsubscriber) {
            this.unsubscriber.unsubscribe()
        }
        this.unsubscriber = this.timer$.subscribe((next) => {
            if (!next) {
                this.start_time = new Date()
                this.player.play()

                setTimeout(() => {
                    if (this.player.isAudioPlaying()) {
                        this.player.pause().then(() => {
                            this.player.seekTo(0).then(() => {
                                this.onClose()
                            })
                        })
                    }
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
        this.player.dispose()
        this.destroy.next(null)
        this.destroy.complete()
    }

    onClose(args?: any): void {
        super.onClose(this.start_time ? {
            start_time: this.start_time
        }: null);
    }
}
