import {Mark} from "./mark"

export interface Athlet {
    id?: string
    nfc_id?: any
    phone: number
    class: string
    fio: string
    number: number
    checkpoints?: Array<Mark>
    [key: string]: any
    created: Date
}
