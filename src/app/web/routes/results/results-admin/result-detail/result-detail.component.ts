import {Component, OnInit} from '@angular/core'
import {ActivatedRoute} from "@angular/router"
import {ResultMark as Mark} from "@src/app/web/routes/results/results.component"
import {AngularFirestore, AngularFirestoreDocument} from "@angular/fire/firestore"
import {MatDialog, MatTableDataSource} from "@angular/material"
import {ResultSetTimeComponent} from "@src/app/web/routes/results/results-admin/result-detail/result-set-time/result-set-time.component"
import * as moment from "moment-timezone"
import * as firebase from "firebase/app"
import {ResultAddMarkComponent} from "@src/app/web/routes/results/results-admin/result-detail/result-add-mark/result-add-mark.component"
import * as _ from "lodash"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import {Competition} from "@src/app/shared/interfaces/competition"
import {Athlet, athletBuiltInKeys} from "@src/app/shared/interfaces/athlet"

@Component({
    selector: 'app-result-detail',
    templateUrl: './result-detail.component.html',
    styleUrls: ['./result-detail.component.scss']
})
export class ResultDetailComponent implements OnInit {

    dataSource = new MatTableDataSource<any>([])
    displayedColumns: string[] = ['cp', 'nfc', 'nfc_cp_offset', 'local', 'actions']
    marks: Array<Mark> = []
    competition: Competition
    athlet: Athlet
    athletBuiltInKeysExcluded: string[] = [...athletBuiltInKeys].map((item) => '!' + item)
    checkpoints: Array<Checkpoint> = []
    circles: number = 0
    start_time: moment
    end_time: moment

    constructor(private route: ActivatedRoute,
                private firestore: AngularFirestore,
                private dialog: MatDialog) {
        this.athlet = route.snapshot.data['athlet']
        this.competition = route.snapshot.data['competition']
        this.checkpoints = this.competition.checkpoints.filter((checkpoint: Checkpoint) => checkpoint.classes.indexOf(this.athlet.class) > -1)
        this.circles = Math.ceil(this.athlet.checkpoints.length / this.checkpoints.length)
        this.start_time = moment(this.competition.start_date.toMillis()).add(this.competition.start_time, 's')
        this.end_time = moment(this.competition.end_date.toMillis()).add(this.competition.start_time + this.competition.duration, 's')
    }

    ngOnInit() {
        this.marks = [...this.athlet.checkpoints.sort((a, b) => a.created < b.created ? -1 : a.created > b.created ? 1 : 0)]
        this.buildRows()
    }

    private buildRows() {
        const cp_in_circle = this.checkpoints.length
        let total_checkpoints: Array<Checkpoint> = []
        let rows: Array<any> = []

        _.range(0, this.circles, 1).forEach(() => {
            this.checkpoints.forEach((checkpoint: Checkpoint) => {
                total_checkpoints.push(checkpoint)
            })
        })


        total_checkpoints.forEach((checkpoint: Checkpoint, index: number) => {
            const mark = this.marks[index]
            if (mark) {
                if (mark.order != checkpoint.order) {
                    this.marks.splice(index, 0, {
                        missing: true,
                        created: null,
                        key: `CP_${(index % cp_in_circle) + 1}`,
                        order: checkpoint.order,
                    })
                }
            }
        })


        this.dataSource.data = total_checkpoints.map((checkpoint: Checkpoint, index: number) => {
            return {
                checkpoint: checkpoint,
                mark: this.marks[index],
                order: (index % cp_in_circle) + 1
            }
        })
    }

    onSetTime(index: number): void {
        const dialogRef = this.dialog.open(ResultSetTimeComponent, {
            width: '250px',
            data: {}
            //build validator
        })
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                delete this.marks[index].missing
                this.marks[index].manual = true

                this.marks[index].created = firebase.firestore.Timestamp.fromMillis(
                    this.start_time.clone().set('hour', result[0]).set('minutes', result[1]).set('seconds', result[2]).format('x')
                )
            }
        })
    }

    onDeleteTime(index: number): void {
        this.marks.splice(index, 1)
        this.marks = this.marks.filter((mark: Mark) => !mark.missing)
        this.buildRows()
    }

    onAddTime(): void {
        const dialogRef = this.dialog.open(ResultAddMarkComponent, {
            width: '250px',
            data: {
                start_time: this.start_time
            }
            //build validator
        })
        dialogRef.afterClosed().subscribe((result: Mark | undefined) => {
            if (result) {
                this.marks.push(result)
                this.onSave()
            }
        })
    }

    onSave(): void {
        const athletDoc: AngularFirestoreDocument<Athlet> = this.firestore.doc<Athlet>(`athlets_${this.competition.id}/${this.athlet.id}`)

        athletDoc.update({
            checkpoints: this.marks.filter((mark: Mark) => !(mark.missing && !mark.created))
        }).then((result) => console.log(result)).catch((err) => alert(err))
    }

    diffTime(a: firebase.firestore.Timestamp | null, b: firebase.firestore.Timestamp | null): string {
        if (a && b) {
            const diff: number = moment(b.toMillis()).diff(moment(a.toMillis()))
            return `+${Math.round(moment.duration(diff).asMinutes())}m`
        }
        return ''
    }

    isLastCp(index: number): boolean {
        return ((index % this.checkpoints.length) == (this.checkpoints.length - 1))
    }

    getTzOffset(timezone: string) {
        return moment.tz(timezone).format('z')
    }
}
