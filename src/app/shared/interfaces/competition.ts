import * as firebase from "firebase/app"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import {Secret} from "@src/app/shared/interfaces/secret"

export interface Competition {
    id?: string,
    user: string,
    secret?: Secret
    created: firebase.firestore.Timestamp,
    title: string,
    time_zone: string,

    start_date: firebase.firestore.Timestamp,
    start_time: firebase.firestore.Timestamp,

    end_date: firebase.firestore.Timestamp,
    duration: firebase.firestore.Timestamp,

    checking: Array<string>,
    group_start: boolean,
    marshal_has_device: boolean,
    result_by_full_circle: boolean,
    classes: Array<string>,
    checkpoints: Array<Checkpoint>,
}
