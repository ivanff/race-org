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
import {Switch} from "tns-core-modules/ui/switch"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {RadListSwipeComponent} from "@src/app/shared/rad-list-swipe.component"
import {ListViewEventData} from "nativescript-ui-listview"
import {Page} from "tns-core-modules/ui/page"
import * as _ from "lodash"
import {StartListGroup} from "@src/app/shared/interfaces/start-list"
import {BehaviorSubject, of} from "rxjs"
import {debounceTime, filter, map, switchMap} from "rxjs/operators"
import {ObservableArray} from "tns-core-modules/data/observable-array"
import {firestore} from "nativescript-plugin-firebase"
import {StartListGoDialogComponent} from "@src/app/start-list/start-list-go-dialog/start-list-go-dialog.component"
import {DatePipe} from "@angular/common"
import {localize as L} from "nativescript-localize"

const firebase = require('nativescript-plugin-firebase/app')

@Component({
    selector: 'app-start-list-group',
    templateUrl: './start-list-group.component.html',
    providers: [DatePipe]
})
export class StartListGroupComponent extends RadListSwipeComponent implements OnInit {
    private classAthlets: Athlet[] = []
    private backupClassAthlet: Athlet[] = []

    activeTab: string
    private activeTab$ = new BehaviorSubject<string>('IN_GROUP')

    backupSelected: number
    radItems = new ObservableArray<Athlet>()
    group: string
    _class: string
    checked = true

    constructor(public routerExtensions: RouterExtensions,
                private page: Page,
                private vcRef: ViewContainerRef,
                private datePipe: DatePipe,
                private _competition: CompetitionService,
                private modalService: ModalDialogService,
                private router: ActivatedRoute) {
        super(routerExtensions)
        this.group = this.router.snapshot.params['group']
        this._class = this.router.snapshot.params['class']

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
        let tmpRadList: Athlet[] = []

        if (this.activeTab == 'IN_GROUP') {
            tmpRadList = this.classAthlets.filter((athlet: Athlet) => athlet.group[this._competition.selected_competition.id].id == this.group)
        } else {
            if (this.checked) {
                tmpRadList = this.classAthlets.filter((athlet: Athlet) => athlet.group[this._competition.selected_competition.id].id != this.group)
            } else {
                tmpRadList = this.classAthlets.filter((athlet: Athlet) => {
                    return athlet.group[this._competition.selected_competition.id].id == athlet.class
                })
            }
        }
        this.radItems.splice(0, this.radItems.length)
        tmpRadList.forEach((item) => {
            this.radItems.push(
                item
            )
        })
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

        this.radItems.splice(
            this.radItems.indexOf(athlet)
            , 1)

        const tmpIndex = this.classAthlets.indexOf(athlet)
        const tmpAthlet = (this.classAthlets[tmpIndex] as Athlet)

        if (this.activeTab == 'OUT_OF_GROUP') {
            this.backupSelected += 1
            tmpAthlet.group[this._competition.selected_competition.id] = {
                id: this.group,
                order: 0,
                start_time: null
            }
        } else {
            for (const athlet of this.router.snapshot.data['athlets']) {
                if (athlet.id == tmpAthlet.id) {
                    if (tmpAthlet.group == athlet.group) {
                        tmpAthlet.group[this._competition.selected_competition.id] = {
                            id: tmpAthlet.class,
                            order: -1,
                            start_time: null
                        } as StartListGroup
                    } else {
                        tmpAthlet.group[this._competition.selected_competition.id] = athlet.group[this._competition.selected_competition.id]
                    }
                }
            }

        }

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
            alert(`Modified ${athlets.length}`)
        })
    }

    private _onSave(): Promise<any> {
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
            return athlets
        })
    }

    onDelete(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
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
                        alert(`Delete ${athlets.length}`)
                        resolve()
                        this.routerExtensions.navigate(['/start-list'], {
                            replaceUrl: true
                        })
                    }, reject)
                })

            })
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
                            resolve(groupAthlets)
                            alert(`Group is started! ${groupAthlets.length}`)
                        }, reject)
                    })
                }
            })
        })
    }
}
