import {Mark} from "@src/app/home/mark"

export interface Athlet {
    phone: number
    fio: string
    number: number
    nfc_id: any
    bike: string
    city: string
    checkpoints: Array<Mark>
}
