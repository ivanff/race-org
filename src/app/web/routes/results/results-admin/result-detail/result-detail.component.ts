import {Component, OnInit} from '@angular/core'
import {ActivatedRoute} from "@angular/router"
import {ResultMark as Mark} from "@src/app/web/routes/results/results.component"
import {AngularFirestore, AngularFirestoreDocument} from "@angular/fire/firestore"
import {MatDialog, MatSnackBar, MatTableDataSource} from "@angular/material"
import {ResultSetTimeComponent} from "@src/app/web/routes/results/results-admin/result-detail/result-set-time/result-set-time.component"
import * as moment from "moment-timezone"
import * as firebase from "firebase/app"
import {ResultAddMarkComponent} from "@src/app/web/routes/results/results-admin/result-detail/result-add-mark/result-add-mark.component"
import * as _ from "lodash"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import {Competition} from "@src/app/shared/interfaces/competition"
import {Athlet, athletBuiltInKeys} from "@src/app/shared/interfaces/athlet"
import {calcCircles} from "@src/app/web/shared/utils/tools"

@Component({
    selector: 'app-result-detail',
    templateUrl: './result-detail.component.html',
    styleUrls: ['./result-detail.component.scss']
})
export class ResultDetailComponent implements OnInit {

    dataSource = new MatTableDataSource<any>([])
    displayedColumns: string[] = ['cp', 'nfc', 'nfc_cp_offset', 'local', 'actions']
    marks: Array<Mark> = []
    other_marks: Array<Mark> = []
    competition: Competition
    athlet: Athlet
    athletBuiltInKeysExcluded: string[] = [...athletBuiltInKeys].map((item) => '!' + item)
    checkpoints: Array<Checkpoint> = []
    start_time: moment
    end_time: moment

    constructor(private route: ActivatedRoute,
                private firestore: AngularFirestore,
                private _snackBar: MatSnackBar,
                private dialog: MatDialog) {

        this.athlet = route.snapshot.data['athlet']
        this.athlet.marks = this.athlet.marks ? this.athlet.marks : []

        this.competition = route.snapshot.data['competition']
        this.checkpoints = this.competition.checkpoints.filter((checkpoint: Checkpoint) => checkpoint.classes.indexOf(this.athlet.class) > -1)
        this.start_time = moment(this.competition.start_date.toMillis()).add(this.competition.start_time, 's')
        this.end_time = moment(this.competition.end_date.toMillis()).add(this.competition.start_time + this.competition.duration, 's')
    }

    ngOnInit() {
        this.marks = [...this.athlet.marks.sort((a, b) => a.created < b.created ? -1 : a.created > b.created ? 1 : 0).filter((mark: Mark) => mark.competition_id == this.competition.id)]
        this.other_marks = [...this.athlet.marks.filter((mark: Mark) => mark.competition_id != this.competition.id)]
        this.buildRows()
    }

    private buildRows() {
        const cp_in_circle = this.checkpoints.length
        let total_checkpoints: Array<Checkpoint> = []

        _.range(0, calcCircles(this.marks, this.checkpoints)).forEach(() => {
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
                        competition_id: this.competition.id
                    })
                }
            } else {
                this.marks.push({
                        missing: true,
                        created: null,
                        key: `CP_${(index % cp_in_circle) + 1}`,
                        order: checkpoint.order,
                        competition_id: this.competition.id
                    }
                )
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

                this.marks[index].created = <firebase.firestore.Timestamp>firebase.firestore.Timestamp.fromMillis(
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
                start_time: this.start_time,
                competition_id: this.competition.id,
                checkpoints: this.checkpoints
            }
            //build validator
        })
        dialogRef.afterClosed().subscribe((result: Mark | undefined) => {
            if (result) {
                this.marks.push(result)
                this.onSave().then(() => {
                    this.buildRows()
                })
            }
        })
    }

    onSave(): Promise<any> {
        const athletDoc: AngularFirestoreDocument<Athlet> = this.firestore.doc<Athlet>(`athlets_${this.competition.id}/${this.athlet.id}`)

        return athletDoc.update({
            marks: [
                ...this.marks.filter((mark: Mark) => !(mark.missing && !mark.created)),...this.other_marks
            ]
        }).then((result) => {
            this._snackBar.open("Сохранено", null, {
                duration: 5000,
                verticalPosition: "top",
                panelClass: 'snack-bar-success'
            })
        }).catch((err) => alert(err))
    }

    diffTime(a: firebase.firestore.Timestamp | null, b: firebase.firestore.Timestamp | null): string {
        if (a && b) {
            const diff: number = moment(b.toMillis()).diff(moment(a.toMillis()))
            if (diff >= 0) {
                return `+${Math.floor(moment.duration(diff).asMinutes())}:${moment.duration(diff).seconds()}`
            } else {
                return `${Math.ceil(moment.duration(diff).asMinutes())}:${Math.abs(moment.duration(diff).seconds())}`
            }
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
