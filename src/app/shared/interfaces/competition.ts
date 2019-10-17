import * as firebase from "firebase/app"
import {Checkpoint} from "@src/app/shared/interfaces/checkpoint"
import {Secret} from "@src/app/shared/interfaces/secret"

export interface Competition {
    id?: string,
    user: string,
    secret?: Secret
    title: string,
    timezone: string,

    start_date: firebase.firestore.Timestamp,
    start_time: number | null,

    end_date: firebase.firestore.Timestamp,
    duration: number | null,

    checking: Array<string>,
    group_start: boolean,
    marshal_has_device: boolean,
    result_by_full_circle: boolean,
    classes: Array<string>,
    checkpoints: Array<Checkpoint>,
    is_stage: boolean,
    stages: Array<Competition>,
    athlet_extra_fields: Array<string>,

    created: firebase.firestore.Timestamp,
}
