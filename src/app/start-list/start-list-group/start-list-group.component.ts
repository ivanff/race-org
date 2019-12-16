import {
    Component, NgZone,
    OnInit,
} from '@angular/core'
import {
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
import {BehaviorSubject, defer, of} from "rxjs"
import {debounceTime, filter, map, switchMap} from "rxjs/operators"
import {ObservableArray} from "tns-core-modules/data/observable-array"
import {firestore} from "nativescript-plugin-firebase"

const firebase = require('nativescript-plugin-firebase/app')

@Component({
    selector: 'app-start-list-group',
    templateUrl: './start-list-group.component.html',
})
export class StartListGroupComponent extends RadListSwipeComponent implements OnInit {
    private classAthlets: Athlet[] = []
    private backupClassAthlet: Athlet[] = []
    activeTab = 'IN_GROUP'
    private activeTab$ = new BehaviorSubject<string>(this.activeTab)


    backupSelected: number
    radItems = new ObservableArray<Athlet>()

    group: string
    _class: string
    checked = true

    constructor(public routerExtensions: RouterExtensions,
                private page: Page,
                private _competition: CompetitionService,
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

    onActiveTab(tab: string): void {
        this.activeTab$.next(tab)
    }

    onSave(): void {
        this._onSave().then((i) => {
            alert(`Modified ${i}`)
        })
    }

    private _onSave(): Promise<number> {
        let batch = firebase.firestore().batch()
        let i = 0
        const collection = firebase.firestore().collection(this._competition.getAthletsCollectionPath())

        this.classAthlets.forEach((item: Athlet) => {
            for (const athlet of this.backupClassAthlet) {
                if (athlet.id == item.id) {
                    if (!_.isEqual(athlet.group, item.group)) {
                        batch.update(collection.doc(item.id), {
                            group: item.group
                        })
                        i += 1
                    }
                    break
                }
            }
        })

        return batch.commit().then(() => {
            return i
        })
    }

    onDelete(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this._onSave().then(() => {
                let i = 0
                let batch = firebase.firestore().batch()
                const collection: firestore.CollectionReference = firebase.firestore().collection(this._competition.getAthletsCollectionPath())
                collection.where(`group.${this._competition.selected_competition.id}.id`, '==', this.group)
                    .get().then((snapshot: firestore.QuerySnapshot) => {
                        snapshot.forEach((doc: firestore.DocumentSnapshot) => {
                            const group = doc.data().group
                            delete group[this._competition.selected_competition.id]
                            batch.update(collection.doc(doc.id), {
                                group: group
                            })
                            i += 1
                        })
                        batch.commit().then(() => {
                            alert(`Delete ${i}`)
                            resolve()
                            this.routerExtensions.navigate(['/start-list'], {
                                replaceUrl: true
                            })
                        }, reject)
                    })

            })
        })

    }

}
