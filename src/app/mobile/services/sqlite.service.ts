import {Injectable, OnDestroy} from '@angular/core'
import {ReplaySubject} from "rxjs"
import {Folder, File} from "tns-core-modules/file-system"
import {Request} from "nativescript-background-http"
import {environment} from "@src/environments/environment"
import {device} from "tns-core-modules/platform"
import * as moment from 'moment'
import {Mark} from "@src/app/shared/interfaces/mark"
import {CompetitionService} from "@src/app/mobile/services/competition.service"
import {SqlRow} from "@src/app/shared/interfaces/sql-row"
import {AuthService} from "@src/app/mobile/services/auth.service"

const bghttp = require("nativescript-background-http")
const Sqlite = require("nativescript-sqlite")

@Injectable({
    providedIn: 'root'
})
export class SqliteService implements OnDestroy {
    destroy = new ReplaySubject<any>(1)
    private sqlite_db_name: string
    private upload_params: Request = {
        url: environment.backend_gateway + '/local_log',
        method: 'POST',
        headers: {
            "Content-Type": "application/octet-stream",
            "File-Name": this.sqlite_db_name
        },
        description: "Uploading " + this.sqlite_db_name,
        utf8: true,
        androidDisplayNotificationProgress: true,
        androidNotificationTitle: "Uploading " + this.sqlite_db_name,
        androidMaxRetries: 1,
        androidAutoClearNotification: true,
        androidRingToneEnabled: true

    }
    private database: any

    constructor(private _competition: CompetitionService,
                private auth: AuthService) {
        this.sqlite_db_name = `race_org_local_${this._competition.selected_competition.id}.db`

        new Sqlite(this.sqlite_db_name).then(db => {
            // db.execSQL("DROP TABLE nfc_scan_events")
            db.execSQL("CREATE TABLE IF NOT EXISTS nfc_scan_events (id INTEGER PRIMARY KEY AUTOINCREMENT, nfc_id TEXT, athlet_id TEXT, checkpoint_order INTEGER NOT NULL, created DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL)").then(id => {
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

    async check(nfc_id: Array<number>, athlet_id: string, mark: Mark) {
        let check_sql: [string, Array<any>]

        if (athlet_id) {
            check_sql = ["SELECT id, created FROM nfc_scan_events WHERE athlet_id = ? AND checkpoint_order = ? ORDER BY id DESC LIMIT 1", [athlet_id, mark.order]]
        } else if (nfc_id.length) {
            check_sql = ["SELECT id, created FROM nfc_scan_events WHERE nfc_id = ? AND checkpoint_order = ? ORDER BY id DESC LIMIT 1", [nfc_id.join(','), mark.order]]
        }

        return await this.database.all(check_sql[0], check_sql[1])
    }

    async insert(nfc_id: Array<number>, athlet_id: string, mark: Mark) {

        const rows = await this.check(nfc_id, athlet_id, mark)
        if (rows) {
            if (rows.length) {
                const row = rows[0]
                const created = row[row.length - 1]
                console.log(
                    rows,
                    moment(created),
                    moment(mark.created).diff(created, 'minutes')
                )
                if (moment(mark.created).diff(created, 'minutes') <= 5) {
                    return
                }
            }
        }

        return await this.database.execSQL("INSERT INTO nfc_scan_events (nfc_id, athlet_id, checkpoint_order, created) VALUES (?, ?, ?, ?)", [
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
        this.database.execSQL("UPDATE nfc_scan_events SET (nfc_id, athlet_id, checkpoint_order, created) VALUES (?, ?, ?, ?) WHERE id = ?", [
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
        return this.database.all("SELECT * FROM nfc_scan_events ORDER BY id DESC LIMIT 1000").then((rows: Array<Array<any>>) => {
            return rows.map((row: Array<any>): SqlRow => {
                return {
                    id: row[0],
                    nfc_id: row[1],
                    athlet_id: row[2],
                    checkpoint_order: row[3],
                    created: moment(row[4]).toDate()
                } as SqlRow
            })
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
                task.on("error", (err) => console.log(err))
                task.on("responded", (err) => console.log(err))
            } else {
                alert(
                    "File size is zero"
                )
            }
        } else {
            alert(
                "Not exists " + db_file.path
            )
        }
    }
}
