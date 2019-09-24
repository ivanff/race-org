export interface CompClass {
    round: number
}

export interface Competition {
    id?: string,
    name: string,
    admin_device: {
        uuid: string
    },
    classes: {[key:string]:CompClass},
    devices: Array<{}>,
    finish: Date,
    secret: string
}
