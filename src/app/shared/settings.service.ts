import {Injectable, OnDestroy} from '@angular/core'
import {Competition} from "@src/app/competition/competition"
import {BehaviorSubject, empty, fromEventPattern, ReplaySubject} from "rxjs"
import {map, switchMap, takeUntil} from "rxjs/operators"
import {firestore} from "nativescript-plugin-firebase"
import {CheckPoint} from "@src/app/home/checkpoint"
import {getString, hasKey, setString} from "tns-core-modules/application-settings"
import {Mark} from "@src/app/home/mark"
import {Item} from "@src/app/scan/local-log/item"

const firebase = require('nativescript-plugin-firebase/app')
const Sqlite = require( "nativescript-sqlite" )

@Injectable({
    providedIn: 'root'
})
export class SettingsService implements OnDestroy {
    competition: Competition
    competition$ = new BehaviorSubject<Competition | null>(null)
    destroy = new ReplaySubject<any>(1)
    private database: any

    constructor() {
        this.competition = this.competition$.getValue()
        this.competition$.pipe(
            switchMap((doc: Competition, i: number) => {
                if (doc) {
                    const db = firebase.firestore()
                    db.settings({ timestampsInSnapshots: true })
                    return fromEventPattern((handler => {
                        return firebase.firestore().collection("competitions").doc(doc.id).onSnapshot({includeMetadataChanges: true}, handler)
                    }), (handler, unsubscribe) => unsubscribe()).pipe(
                        map((doc: firestore.DocumentSnapshot) => {
                            const id = doc.id
                            return {id,...doc.data()} as Competition
                        }),
                        takeUntil(this.destroy)
                    )

                } else {
                    return empty()
                }

            })
        ).subscribe((next: Competition | null) => {
            if (next) {
                this.competition = next
            }
        })

        new Sqlite("race_org_local.db").then(db => {
            db.execSQL("DROP TABLE nfc_scan_events")
            db.execSQL("CREATE TABLE IF NOT EXISTS nfc_scan_events (id INTEGER PRIMARY KEY AUTOINCREMENT, nfc_id TEXT, athlet_id TEXT, checkpoint_key TEXT NOT NULL, checkpoint_order INTEGER NOT NULL, created DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL)").then(id => {
                this.database = db;
            }, error => {
                console.log("CREATE TABLE ERROR", error);
            });
        }, error => {
            console.log("OPEN DB ERROR", error);
        });
    }

    ngOnDestroy(): void {
        this.destroy.next(null)
        this.destroy.complete()
    }

    setCp(checkpoint: CheckPoint): void {
        setString('cp', JSON.stringify(checkpoint))
    }

    getCp(): CheckPoint | null {
        if (this.hasCp()) {
            try {
                return JSON.parse(getString('cp')) as CheckPoint
            } catch (e) {
                console.error(e)
            }

        }
    }

    hasCp(): boolean {
        if (hasKey('cp')) {
            try {
                JSON.parse(getString('cp'))
                return true
            } catch (e) {
                console.error(e)
                return false
            }
        } else {
            return false
        }
    }

    insert(nfc_id: Array<number>, athlet_id: string, mark: Mark) {
        return this.database.execSQL("INSERT INTO nfc_scan_events (nfc_id, athlet_id, checkpoint_key, checkpoint_order, created) VALUES (?, ?, ?, ?, ?)", [
            nfc_id.join(','),
            athlet_id,
            mark.key,
            mark.order,
            mark.created
        ]).then(id => {
            console.log("ID", id)
        }, error => {
            console.log("INSERT ERROR", error);
        });
    }

    update(id: number, nfc_id: Array<number>, athlet_id: string, mark: Mark) {
        this.database.execSQL("UPDATE nfc_scan_events SET (nfc_id, athlet_id, checkpoint_key, checkpoint_order, created) VALUES (?, ?, ?, ?, ?) WHERE id = ?", [
            nfc_id.join(','),
            athlet_id,
            mark.key,
            mark.order,
            mark.created,
            id
        ]).then(id => {
            console.log("ID", id)
        }, error => {
            console.log("INSERT ERROR", error);
        });
    }

    fetch() {
        return this.database.all("SELECT * FROM nfc_scan_events ORDER BY created ASC LIMIT 1000").then((rows: Array<Array<any>>) => {
            return rows.map((row: Array<any>): Item => {
                return {
                    id: row[0],
                    nfc_id: row[1],
                    athlet_id: row[2],
                    checkpoint_key: row[3],
                    checkpoint_order: row[4],
                    created: row[5]
                } as Item
            })
        })
    }

}
