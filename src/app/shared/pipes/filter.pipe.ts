import {Pipe, PipeTransform} from '@angular/core'

@Pipe({
    name: 'filter'
})
export class FilterPipe implements PipeTransform {
    transform(items: any[], field: string | Array<string>, value: {search?: string, class?: string, key?: string | Array<string>}): any[] {
      if (!items) {
        return []
      }
      if (!value.search && !value.class && !value.key) {
        return items
      }
      return items.filter(it => {
          let result = true

          if (Array.isArray(field)) {
              if (value.search) {
                  for (let f of field) {
                      result = it[f].toString().toLowerCase().indexOf(value.search.toLowerCase()) >= 0
                      if (result) {
                          break
                      }
                  }
              }

          } else {
              if (value.search) {
                  result = it[field].toLowerCase().indexOf(value.search.toLowerCase()) >= 0
              }

              if (Array.isArray(value.key)) {
                  const excluded_keys = value.key.filter((item: string) => item[0] == '!')
                  const included_keys = value.key.filter((item: string) => item[0] != '!')

                  if (excluded_keys.length) {
                      result = result && excluded_keys.indexOf('!' + it[field]) == -1
                  }
                  if (included_keys.length) {
                      result = result && included_keys.indexOf(it[field]) > -1
                  }
              }

          }

          if (value.class) {
              result = result && (it.class == value.class)
          }

          return result
      })
    }
}
