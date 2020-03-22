import {Injectable, OnDestroy, OnInit} from '@angular/core'
import {ReplaySubject} from "rxjs"
import {Folder, File} from "@nativescript/core/file-system"
import {Request} from "nativescript-background-http"
import {environment} from "@src/environments/environment"
import {device} from "@nativescript/core/platform"
import {Mark} from "@src/app/shared/interfaces/mark"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {SqlRow} from "@src/app/shared/interfaces/sql-row"
import {AuthService} from "@src/app/mobile/services/auth.service"
import * as _ from "lodash"
import {SnackbarService} from "@src/app/mobile/services/snackbar.service"
import {localize as L} from "nativescript-localize"

const bghttp = require("nativescript-background-http")
const Sqlite = require("nativescript-sqlite")

@Injectable({
    providedIn: 'root'
})
export class SqliteService implements OnInit, OnDestroy {
    destroy = new ReplaySubject<any>(1)
    private sqlite_db_name: string
    private upload_params: Request = {
        url: environment.backend_gateway + '/local_log',
        method: 'POST',
        headers: {
            "Content-Type": "application/octet-stream",
            "File-Name": this.sqlite_db_name
        },
        description: L("Uploading... %s"),
        utf8: true,
        androidDisplayNotificationProgress: true,
        androidMaxRetries: 1,
        androidAutoClearNotification: true,
        androidRingToneEnabled: true

    }
    private database: any
    private tableName = 'scan_events'
    private dbFields = {
        id: {
            type: 'number',
            create_string: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            primary: true
        },
        competition_id: {
            type: 'string',
            create_string: 'TEXT',
            index: true,
        },
        competition_parent_id: {
            type: 'string',
            create_string: 'TEXT',
            index: true,
        },
        nfc_id: {
            type: 'string',
            create_string: 'TEXT',
            index: true,
        },
        athlet_id: {
            type: 'string',
            create_string: 'TEXT',
            index: true,
        },
        checkpoint_order: {
            type: 'number',
            create_string: 'INTEGER NOT NULL'
        },
        created: {
            type: 'string',
            create_string: 'DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL'
        },
    }

    constructor(private _competition: CompetitionService,
                private snackbar: SnackbarService,
                private auth: AuthService) {
        this.sqlite_db_name = `race_org_local_${this._competition.selected_competition.parent_id || this._competition.selected_competition.id}.db`
        this.upload_params.description = L("Uploading... %s", this.sqlite_db_name)
        this.upload_params.androidNotificationTitle = L("Uploading... %s", this.sqlite_db_name)
        new Sqlite(this.sqlite_db_name).then(db => {
            db.execSQL(`CREATE TABLE IF NOT EXISTS ${this.tableName} (${_.map(this.dbFields, (value: any, key: string) => key + ' ' + value.create_string).join(', ')})`).then(id => {
                this.database = db;
                _.map(this.dbFields, (value: any, key: string) => {
                    if (value.index) {
                        return `CREATE INDEX IF NOT EXISTS ${key} ON ${this.tableName}(${key})`
                    }
                    return ''
                }).filter((item) => item.length).map((create_string) => {
                    db.execSQL(create_string).then(() => {
                    }).catch((err) => {
                        this.snackbar.snackbar$.next({
                            level: 'alert',
                            msg: L('Create index error: %s', _.truncate(err.message, {length: 150}))
                        })
                    })
                })

            }).catch((err: Error) => {
                this.snackbar.snackbar$.next({
                    level: 'alert',
                    msg: L('Create table error: %s', _.truncate(err.message, {length: 150}))
                })
            })
        }, (err: Error) => {
            this.snackbar.snackbar$.next({
                level: 'alert',
                msg: L('Open db error: %s', _.truncate(err.message, {length: 150}))
            })
        });
    }

    ngOnInit(): void {
        console.log('>> SqliteService ngOnInit')
    }

    ngOnDestroy(): void {
        this.destroy.next(null)
        this.destroy.complete()
    }

    async check(nfc_id: Array<number>, athlet_id: string, mark: Mark) {
        let check_sql: [string, Array<any>]

        if (athlet_id) {
            check_sql = [`SELECT id, created FROM ${this.tableName} WHERE athlet_id = ? AND checkpoint_order = ? ORDER BY id DESC LIMIT 1`, [athlet_id, mark.order]]
        } else if (nfc_id.length) {
            check_sql = [`SELECT id, created FROM ${this.tableName} WHERE nfc_id = ? AND checkpoint_order = ? ORDER BY id DESC LIMIT 1`, [nfc_id.join(','), mark.order]]
        }

        return await this.database.all(check_sql[0], check_sql[1])
    }

    async insert(nfc_id: Array<number>, athlet_id: string, mark: Mark) {

        // const rows = await this.check(nfc_id, athlet_id, mark)
        // if (rows) {
        //     if (rows.length) {
        //         const row = rows[0]
        //         const created = row[row.length - 1]
        //         console.log(
        //             rows,
        //             moment(created),
        //             moment(mark.created).diff(created, 'minutes')
        //         )
        //         if (moment(mark.created).diff(created, 'minutes') <= 5) {
        //             return
        //         }
        //     }
        // }

        return await this.database.execSQL(`INSERT INTO ${this.tableName} (competition_id, competition_parent_id, nfc_id, athlet_id, checkpoint_order, created) VALUES (?, ?, ?, ?, ?, ?)`, [
            this._competition.selected_competition.id,
            this._competition.selected_competition.parent_id,
            nfc_id.join(','),
            athlet_id,
            mark.order,
            mark.created.toISOString()
        ]).then(id => {
            console.log("ID", id)
        }, error => {
            console.log("INSERT ERROR", error);
        });
    }

    update(id: number, nfc_id: Array<number>, athlet_id: string, mark: Mark) {
        this.database.execSQL("UPDATE nfc_scan_events SET (competition_id, competition_parent_id, nfc_id, athlet_id, checkpoint_order, created) VALUES (?, ?, ?, ?, ?, ?) WHERE id = ?", [
            this._competition.selected_competition.id,
            this._competition.selected_competition.parent_id,
            nfc_id.join(','),
            athlet_id,
            mark.order,
            mark.created.toISOString(),
            id
        ]).then(id => {
            console.log("ID", id)
        }, error => {
            console.log("INSERT ERROR", error);
        });
    }

    fetch() {
        return this.database.all(`SELECT * FROM ${this.tableName} ORDER BY id DESC LIMIT 1000`).then((rows: Array<Array<any>>) => {
            return rows.map((row: Array<any>): SqlRow => {
                const keys = _.keys(this.dbFields)
                return _.reduce(this.dbFields, (result, value, key) => {
                    result[key] = row[keys.indexOf(key)]
                    return result
                }, {}) as SqlRow
            })
        })
    }

    dropTable() {
        this.database.execSQL(`DROP TABLE ${this.tableName}`).then((f) => {
            this.snackbar.success(
                L('Table %s dropped!', this.tableName)
            )
        }).catch((err: Error) => {
            this.snackbar.alert(
                _.truncate(err.message, {length: 150})
            )
        })
    }

    upload() {
        // Sqlite.copyDatabase(this.sqlite_db_name)
        const folder: Folder = Folder.fromPath('/data/data/org.nativescript.raceorg/databases/')
        const db_file: File = folder.getFile(this.sqlite_db_name)
        if (File.exists(db_file.path)) {
            if (db_file.size > 0) {
                const session = bghttp.session("db-upload")
                const task = session.multipartUpload([
                    {name: 'device_uuid', value: device.uuid},
                    {name: 'competition_id', value: this._competition.selected_competition.id},
                    {name: 'user_uid', value: this.auth.user.uid},
                    {name: 'fileToUpload', filename: db_file.path, mimeType: "application/x-sqlite3"},
                ], this.upload_params)
                console.log(
                    [
                        {name: 'device_uuid', value: device.uuid},
                        {name: 'competition_id', value: this._competition.selected_competition.id},
                        {name: 'user_uid', value: this.auth.user.uid},
                        {name: 'fileToUpload', filename: db_file.path, mimeType: "application/x-sqlite3"},
                    ],
                    this.upload_params
                )
                task.on("error", (err) => console.log(err))
                task.on("responded", (e) => {
                    alert("received " + e.responseCode + " code. Server sent: " + e.data)
                })
            } else {
                this.snackbar.alert(
                    L("File size is zero")
                )
            }
        } else {
            this.snackbar.alert(
                L("File does't exists %s", db_file.path)
            )
        }
    }
}
