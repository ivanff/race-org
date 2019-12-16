import {Component, OnDestroy, OnInit, ViewContainerRef} from "@angular/core"
import {ReplaySubject} from "rxjs"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {ModalDialogOptions, ModalDialogParams, ModalDialogService, RouterExtensions} from "nativescript-angular"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {ActivatedRoute} from "@angular/router"
import {map, takeUntil} from "rxjs/operators"
import {StartListGroup} from "@src/app/shared/interfaces/start-list"
import {StartListAddDialogComponent} from "@src/app/start-list/start-list-add-dialog/start-list-add-dialog.component"
import * as _ from "lodash"
import {SnackbarService} from "@src/app/mobile/services/snackbar.service"
import {localize as L} from "nativescript-localize"

const firebase = require('nativescript-plugin-firebase/app')


@Component({
    templateUrl: './start-list-tab-item.component.tns.html'
})
export class StartListTabItemComponent implements OnInit, OnDestroy {
    private destroy = new ReplaySubject<any>(1)
    _class: string
    groupsDict = {}
    athlets: Array<Athlet> = []

    constructor(private _params: ModalDialogParams,
                private _competition: CompetitionService,
                private modalService: ModalDialogService,
                private vcRef: ViewContainerRef,
                private activeRoute: ActivatedRoute,
                private routerExtensions: RouterExtensions,
                private snackbar: SnackbarService) {
        this._class = _params.context._class
        _params.context.athletsBehavior$.pipe(
            map((athlets: Array<Athlet>) => {
                return athlets.filter((athlet) => athlet.class == this._class)
            }),
            takeUntil(this.destroy)
        ).subscribe((athlets: Array<Athlet>) => {
            this.athlets = athlets
            const groupsDict = {}

            athlets.sort((a: Athlet, b: Athlet): number => {
                if (a.group && b.group) {
                    if (a.group[this._competition.selected_competition.id] && b.group[this._competition.selected_competition.id]) {
                        return a.group[this._competition.selected_competition.id].order > b.group[this._competition.selected_competition.id].order ? -1 : 1
                    }
                }
                return 0
            }).map((athlet: Athlet) => {
                const blank_group: StartListGroup = {
                    id: this._class,
                    order: -1,
                    start_time: null
                }
                const group: StartListGroup = athlet.group ? (athlet.group.hasOwnProperty(this._competition.selected_competition.id) ? athlet.group[this._competition.selected_competition.id] : blank_group) : blank_group
                if (!groupsDict.hasOwnProperty(group.id)) {
                    groupsDict[group.id] = [athlet]

                } else {
                    groupsDict[group.id].push(athlet)
                }
            })

            this.groupsDict = groupsDict
        })
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
        console.log(
            'ngOnDestroy StartListTabComponent2'
        )
        this.destroy.next(null)
        this.destroy.complete()
    }

    getNumbers(athlets: Array<Athlet>): string {
        return athlets.map((athlet: Athlet) => athlet.number).sort((a, b) => a > b ? 1 : -1).join(';')
    }

    onSplit(): Promise<any> {
        const options: ModalDialogOptions = {
            context: {
                _class: this._class,
                groupsCount: Object.keys(this.groupsDict).length
            },
            viewContainerRef: this.vcRef,
            fullscreen: false
        }

        return this.modalService.showModal(StartListAddDialogComponent, options).then((resp: {action: string, value?: any} | null) => {
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
        let batch = firebase.firestore().batch()
        const collection = firebase.firestore().collection(this._competition.getAthletsCollectionPath())
        this.athlets.forEach((athlet: Athlet) => {
            batch = batch.update(collection.doc(athlet.id), {group: null})
        })
        batch.commit().then(() => {
            alert(`Remove Group '${this._class}' success`)
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
                reject(L(`Size of group is more than athletes count (${athlets.length}) in class`))
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
