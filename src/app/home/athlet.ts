import {Mark} from "@src/app/home/mark"

export interface Athlet {
    id?: string
    phone: number
    class: string
    fio: string
    number: number
    command?: string
    nfc_id?: any
    bike: string
    city: string
    checkpoints?: Array<Mark>
}
