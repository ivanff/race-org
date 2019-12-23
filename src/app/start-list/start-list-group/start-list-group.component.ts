import {
    Component,
    OnInit, ViewContainerRef,
} from '@angular/core'
import {
    ModalDialogOptions,
    ModalDialogService,
    RouterExtensions
} from "nativescript-angular"
import {Athlet} from "@src/app/shared/interfaces/athlet"
import {ActivatedRoute} from "@angular/router"
import {Switch} from "@nativescript/core/ui/switch"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {RadListSwipeComponent} from "@src/app/shared/rad-list-swipe.component"
import {ListViewEventData,} from "nativescript-ui-listview"
import {Page} from "@nativescript/core/ui/page"
import * as _ from "lodash"
import {StartListGroup} from "@src/app/shared/interfaces/start-list"
import {BehaviorSubject, of} from "rxjs"
import {debounceTime, filter, map, switchMap} from "rxjs/operators"
import {ObservableArray} from "@nativescript/core/data/observable-array"
import {firestore} from "nativescript-plugin-firebase"
import {StartListGoDialogComponent} from "@src/app/start-list/start-list-go-dialog/start-list-go-dialog.component"
import {DatePipe} from "@angular/common"
import {localize as L} from "nativescript-localize"
import {SnackbarService} from "@src/app/mobile/services/snackbar.service"

const firebase = require('nativescript-plugin-firebase/app')

@Component({
    selector: 'app-start-list-group',
    templateUrl: './start-list-group.component.html',
    providers: [DatePipe]
})
export class StartListGroupComponent extends RadListSwipeComponent implements OnInit {
    private classAthlets: Athlet[] = []
    private backupClassAthlet: Athlet[] = []
    private activeTab$ = new BehaviorSubject<string>('IN_GROUP')
    private order = -1

    pending = false
    activeTab = this.activeTab$.getValue()
    backupSelected: number
    radItems = new ObservableArray<Athlet>([])
    group: string
    _class: string
    checked = true

    constructor(public routerExtensions: RouterExtensions,
                private page: Page,
                private vcRef: ViewContainerRef,
                private datePipe: DatePipe,
                private _competition: CompetitionService,
                private modalService: ModalDialogService,
                private router: ActivatedRoute,
                private snackbar: SnackbarService) {
        super(routerExtensions)
        this.group = this.router.snapshot.params['group']
        this._class = this.router.snapshot.params['class']

        const orderMatch = (new RegExp('\_(\d+)$')).exec(this.group)
        if (orderMatch) {
            this.order = parseInt(orderMatch[1])
        }

        this.classAthlets = this.router.snapshot.data['athlets'].sort((a: Athlet, b: Athlet) => a.number > b.number ? 1 : -1)
        this.backupClassAthlet = _.cloneDeep(this.classAthlets)

        this.activeTab$.pipe(
            debounceTime(300),
            filter((activeTab) => this.activeTab != activeTab),
            map((activeTab) => {
                if (this.activeTab == 'IN_GROUP') {
                    this.backupSelected = this.radItems.length
                }
                this.activeTab = activeTab
            }),
            switchMap(() => {
                return of(this.updateRadItems())
            })
        ).subscribe()
    }

    private updateRadItems(): void {
        this.radItems.splice(0, this.radItems.length)

        let tmpRadList: Athlet[] = []

        if (this.activeTab == 'IN_GROUP') {
            tmpRadList = this.classAthlets.filter((athlet: Athlet) => athlet.group[this._competition.selected_competition.id].id == this.group)
        } else {
            if (this.checked) {
                tmpRadList = this.classAthlets.filter((athlet: Athlet) => athlet.group[this._competition.selected_competition.id].id != this.group)
            } else {
                tmpRadList = this.classAthlets.filter((athlet: Athlet) => athlet.group[this._competition.selected_competition.id].id == athlet.class)
            }
        }
        tmpRadList.forEach((item) => {
            this.radItems.push(
                item
            )
        })
        // this.listView.refresh()
    }

    ngOnInit(): void {
    }

    onCheckedChange($event): void {
        const sw = $event.object as Switch
        if (this.checked != sw.checked) {
            this.checked = sw.checked
            this.updateRadItems()
        }
    }

    onLeftSwipeClick(args: ListViewEventData): void {
        const athlet = args.object.bindingContext as Athlet

        this.radItems.splice(this.radItems.indexOf(athlet), 1)

        const tmpIndex = this.classAthlets.indexOf(athlet)
        const tmpAthlet: Athlet = this.classAthlets[tmpIndex]

        if (this.activeTab == 'OUT_OF_GROUP') {
            this.backupSelected += 1

            tmpAthlet.group[this._competition.selected_competition.id] = {
                id: this.group,
                order: this.order,
                start_time: null
            }
        } else {
            for (const athlet of this.router.snapshot.data['athlets']) {
                if (athlet.id == tmpAthlet.id) {
                    if (tmpAthlet.group == athlet.group) {
                        tmpAthlet.group[this._competition.selected_competition.id] = {
                            id: tmpAthlet.class,
                            order: this.order,
                            start_time: null
                        } as StartListGroup
                    } else {
                        tmpAthlet.group[this._competition.selected_competition.id] = athlet.group[this._competition.selected_competition.id]
                    }
                }
            }

        }
        this.listView.refresh()
        super.onLeftSwipeClick(args)
    }

    onRightSwipeClick(args: ListViewEventData): void {
        const athlet = args.object.bindingContext as Athlet
        super.onRightSwipeClick(args)
        this.routerExtensions.navigate(['/athlets', athlet.id])
    }

    radListLoaded($event): void {
        this.updateRadItems()
    }

    getStartTime(athlet: Athlet): string {
        const start_time: Date | null = athlet.group[this._competition.selected_competition.id].start_time
        if (start_time) {
            return this.datePipe.transform(start_time, 'dd.MM HH:mm:ss')
        }
        return L("Not started")
    }

    onActiveTab(tab: string): void {
        this.activeTab$.next(tab)
    }

    onSave(): void {
        this._onSave().then((athlets: Athlet[]) => {
            return this.snackbar.success(L('Modified %s athlete(s)', athlets.length.toString()))
        })
    }

    private _onSave(): Promise<any> {
        this.pending = true

        let batch = firebase.firestore().batch()
        const collection = firebase.firestore().collection(this._competition.getAthletsCollectionPath())
        const athlets: Athlet[] = []

        this.classAthlets.forEach((item: Athlet) => {
            for (const athlet of this.backupClassAthlet) {
                if (athlet.id == item.id) {
                    if (!_.isEqual(athlet.group, item.group)) {
                        batch.update(collection.doc(item.id), {
                            group: item.group
                        })
                        athlets.push(item)
                    }
                    break
                }
            }
        })

        return batch.commit().then(() => {
            this.backupClassAthlet = _.cloneDeep(this.classAthlets)
            return athlets
        }).finally(() => {
            this.updateRadItems()
            this.pending = false
        })
    }

    onDelete(): Promise<any> {
        this.pending = true

        return new Promise<any>((resolve, reject) => {
            this.snackbar.confirm(L("The group %s will not be deleted!", this.group)).then((result: boolean) => {
                if (result) {
                    this._onSave().then(() => {
                        const athlets: Athlet[] = []
                        let batch = firebase.firestore().batch()
                        const collection: firestore.CollectionReference = firebase.firestore().collection(this._competition.getAthletsCollectionPath())
                        collection.where(`group.${this._competition.selected_competition.id}.id`, '==', this.group)
                            .get().then((snapshot: firestore.QuerySnapshot) => {
                            snapshot.forEach((doc: firestore.DocumentSnapshot) => {
                                const group = doc.data().group
                                const id = doc.id
                                delete group[this._competition.selected_competition.id]
                                batch.update(collection.doc(id), {
                                    group: group
                                })
                                athlets.push({
                                    id, ...doc.data(), ...group
                                } as Athlet)
                            })
                            batch.commit().then(() => {
                                this.snackbar.success(L('Removed %s athlete(s)', athlets.length.toString())).then(() => {
                                    resolve()
                                    this.routerExtensions.navigate(['/start-list'], {
                                        replaceUrl: true
                                    })
                                })
                            }, (err) => {
                                this.snackbar.alert(err).then(() => {
                                    reject(err)
                                })
                            })
                        })

                    })
                } else {
                    reject()
                }
            })
        }).finally(() => {
            this.pending = false
        })

    }

    onStart(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.modalService.showModal(StartListGoDialogComponent, {
                viewContainerRef: this.vcRef,
            } as ModalDialogOptions).then((result: { start_time: Date } | null) => {
                if (result) {
                    this._onSave().then(() => {

                        const groupAthlets = this.classAthlets.filter((athlet: Athlet) => athlet.group[this._competition.selected_competition.id].id == this.group)

                        let batch = firebase.firestore().batch()
                        const collection: firestore.CollectionReference = firebase.firestore().collection(this._competition.getAthletsCollectionPath())

                        groupAthlets.forEach((athlet: Athlet) => {
                            athlet.group[this._competition.selected_competition.id].start_time = result.start_time
                            batch.update(collection.doc(athlet.id), {
                                group: athlet.group
                            })
                        })

                        batch.commit().then(() => {
                            this.snackbar.success(L('Group %s is started\nat %s', this.group, result.start_time.toISOString())).then(() => {
                                resolve(groupAthlets)
                            })
                        }, (err) => {
                            this.snackbar.alert(err).then(() => {
                                reject(err)
                            })
                        })
                    })
                }
            })
        })
    }
}
