import {Mark} from "./mark"
import * as firebase from "firebase/app"

export interface Athlet {
    id?: string
    nfc_id?: any
    phone: number
    class: string
    fio: string
    number: number
    group?: string
    marks?: Array<Mark>
    [key: string]: any
    start_time?: firebase.firestore.Timestamp
    created: firebase.firestore.Timestamp
}

export const athletBuiltInKeys: string[] = [
    'nfc_id',
    'phone',
    'id',
    'created',
    'number',
    'checkpoints',
    'fio',
    'class'
]
