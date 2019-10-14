import {Pipe, PipeTransform} from '@angular/core'

@Pipe({
    name: 'filter'
})
export class FilterPipe implements PipeTransform {
    transform(items: any[], field: string | Array<string>, value: {search?: string, class?: string}): any[] {
      if (!items) {
        return []
      }
      if (!value.search && !value.class) {
        return items
      }
      return items.filter(it => {
          if (Array.isArray(field)) {
              let result = true

              if (value.search) {
                  for (let f of field) {
                      result = it[f].toString().toLowerCase().indexOf(value.search.toLowerCase()) >= 0
                      if (result) {
                          break
                      }
                  }
              }

              if (value.class) {
                  return result && (it.class == value.class)
              }

              return result
          } else {
              return it[field].toLowerCase().indexOf(value.search.toLowerCase()) >= 0
          }
      })
    }
}
