export interface MobileDevice {
    uuid: string
    model: string
    deviceType: string
    osVersion: string
    isAdmin: boolean
    created?: Date
}
