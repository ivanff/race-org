import * as firebase from "firebase/app"
import {StartListGroup} from "@src/app/shared/interfaces/start-list"
import { Mark } from "./mark.tns";

export interface Athlet {
    id?: string
    nfc_id?: any
    phone: number
    class: string
    fio: string
    number: number
    group?: {
        [key: string]: StartListGroup
    }
    marks?: Array<Mark>
    [key: string]: any
    get_off: "DNS" | "DNF" | "DSQ" | null
    start_time?: firebase.firestore.Timestamp
    created: firebase.firestore.Timestamp
}

export const athletBuiltInKeys: string[] = [
    'nfc_id',
    'phone',
    'id',
    'created',
    'number',
    'marks',
    'group',
    'fio',
    'class'
]
