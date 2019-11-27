import {Pipe, PipeTransform} from '@angular/core'

@Pipe({
    name: 'join'
})
export class JoinPipe implements PipeTransform {
    transform(list: Array<any>, sep?: string): string {
        return list.join(sep || ', ')
    }
}
