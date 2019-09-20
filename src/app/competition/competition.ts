import {Device} from "tns-core-modules/platform"

export interface CompClass {
    round: number
}

export interface Competition {
    id?: string,
    name: string,
    admin_device: {},
    classes: {[key:string]:CompClass},
    devices: Array<{}>,
    finish: Date,
    secret: string
}
