import {AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewContainerRef} from "@angular/core"
import {ReplaySubject} from "rxjs"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {ModalDialogOptions, ModalDialogParams, ModalDialogService, RouterExtensions} from "nativescript-angular"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {ActivatedRoute} from "@angular/router"
import {map, switchMap, takeUntil, takeWhile} from "rxjs/operators"
import {StartListGroup} from "@src/app/shared/interfaces/start-list"
import {StartListAddDialogComponent} from "@src/app/start-list/start-list-add-dialog/start-list-add-dialog.component"
import * as _ from "lodash"
import {SnackbarService} from "@src/app/mobile/services/snackbar.service"
import {localize as L} from "nativescript-localize"
import {groupNumberMatch, hasGroup, sortNumber} from "@src/app/shared/helpers"
import {TzDatePipe} from "@src/app/shared/pipes/tzdate.pipe"

const firebase = require('nativescript-plugin-firebase/app')


@Component({
    templateUrl: './start-list-tab-item.component.tns.html',
    providers: [TzDatePipe]
})
export class StartListTabItemComponent implements OnInit, OnDestroy {
    private destroy = new ReplaySubject<any>(1)
    _class: string
    groupsArray: Array<any> = []
    athlets: Array<Athlet> = []

    constructor(private _params: ModalDialogParams,
                private _competition: CompetitionService,
                private modalService: ModalDialogService,
                private vcRef: ViewContainerRef,
                private tzDatePipe: TzDatePipe,
                private activeRoute: ActivatedRoute,
                private routerExtensions: RouterExtensions,
                private snackbar: SnackbarService,) {
        this._class = _params.context._class
    }

    ngOnInit(): void {
        const blank_group: StartListGroup = {
            id: this._class,
            order: -1,
            start_time: null
        }

        this._params.context.tabIndex$.pipe(
            switchMap((i) => {
                return this._params.context.athletsBehavior$.pipe(
                    map((athlets: Array<Athlet>) => {
                        return athlets.filter((athlet) => athlet.class == this._class)
                    }),
                    takeWhile(() => {
                        return i == this._params.context.tabIndex
                    })
                )
            }),
            takeUntil(this.destroy)
        ).subscribe((athlets: Array<Athlet>) => {
            this.athlets = athlets
            const groupsDict = {}

            athlets.map((athlet: Athlet) => {

                if (!hasGroup(athlet, this._competition.selected_competition)) {
                    athlet.group = {} || athlet.group
                    athlet.group[this._competition.selected_competition.id] = blank_group
                }

                const group: StartListGroup = athlet.group[this._competition.selected_competition.id]
                if (!groupsDict.hasOwnProperty(group.id)) {
                    groupsDict[group.id] = [athlet]

                } else {
                    groupsDict[group.id].push(athlet)
                }
            })

            this.groupsArray.splice(0, this.groupsArray.length)

            for (let [key, value] of Object.entries(groupsDict).sort((a, b) => {
                return sortNumber(groupNumberMatch(a[0]), groupNumberMatch(b[0]))
            })) {
                this.groupsArray.push({
                    key: key,
                    value: value
                })
            }
        })
    }

    ngOnDestroy(): void {
        console.log(
            `ngOnDestroy StartListTabItemComponent ${this._params.context.tabIndex}`
        )
        this.destroy.next(null)
        this.destroy.complete()
    }

    getNumbers(athlets: Array<Athlet>): string {
        return athlets.map((athlet: Athlet) => athlet.number).sort(sortNumber).join(';')
    }

    getStartTime(athlets: Array<Athlet>): string {
        if (athlets.length) {
            const start_time: Date | null = athlets[0].group[this._competition.selected_competition.id].start_time
            if (start_time) {
                return `${this.tzDatePipe.transform(start_time, 'shortDate')} ${this.tzDatePipe.transform(start_time, 'mediumTime')}`
            }
        }
        return L("Not started")
    }

    onSplit(): Promise<any> {
        const options: ModalDialogOptions = {
            context: {
                _class: this._class,
                groupsKeys: this.groupsArray.map((item) => item.key)
            },
            viewContainerRef: this.vcRef,
            fullscreen: false
        }

        return this.modalService.showModal(StartListAddDialogComponent, options).then((resp: { action: string, value?: any } | null) => {
            if (resp) {
                switch (resp.action) {
                    case 'size':
                        return this.splitAthlet(_.shuffle(this.athlets), resp.value).catch((err) => {
                            this.snackbar.alert(err)
                        })
                    case 'stage':
                        alert("#TODO need stage results fixed")
                        return null
                    case 'navigate':
                        setTimeout(() => {
                            this.routerExtensions.navigate(resp.value, {relativeTo: this.activeRoute})
                        }, 100)
                        return null
                    default:
                        return null
                }
            }
        });
    }

    onRemoveGroup(): void {
        this.snackbar.confirm(L("All groups of this class will be deleted!")).then((result: boolean) => {
            if (result) {
                let batch = firebase.firestore().batch()
                const collection = firebase.firestore().collection(this._competition.getAthletsCollectionPath())
                this.athlets.forEach((athlet: Athlet) => {
                    batch = batch.update(collection.doc(athlet.id), {group: null})
                })
                batch.commit().then(() => {
                    this.snackbar.success(`Group '${this._class}' is removed`)
                }, (err) => {
                    this.snackbar.alert(err)
                })
            }
        })
    }

    onItemTap($event): void {
        const item = $event.object.items[$event.index]
        this.routerExtensions.navigate(['list', this._class, `${item.key}`], {
            relativeTo: this.activeRoute
        })
    }

    private splitAthlet(athlets: Array<Athlet>, size: number): Promise<any> {
        return new Promise((resolve, reject) => {
            if (athlets.length < size) {
                reject(L('Size of group is more than athletes count (%s) in class', athlets.length.toString()))
            } else {
                let batch = firebase.firestore().batch()
                const collection = firebase.firestore().collection(this._competition.getAthletsCollectionPath())
                _.chunk(athlets, size).forEach((group: Array<Athlet>, index: number) => {
                    group.forEach((athlet: Athlet) => {
                        const athlet_group = athlet.group || {}

                        athlet_group[this._competition.selected_competition.id] = {
                            id: `${this._class}_${index}`,
                            order: index,
                            start_time: null
                        } as StartListGroup

                        batch = batch.update(collection.doc(athlet.id), {
                            group: athlet_group
                        })
                    })
                })
                return batch.commit().then(() => {
                    resolve()
                }, reject)
            }
        })
    }
}
