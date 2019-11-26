#!/bin/bash

files=($(grep --include=\*.{tns\.html,tns\.ts} -rnw './src/' -e '[а-яА-Я]' | cut -d: -f1 | sort -u))

json=''
for i in "${files[@]}"; do
  echo $i
  a=`python /home/ivan/pycharm-workplace/agestart/mobile/ru_to_json.py $i`

  if [ ! -z "$a" ]
  then
    json="${json} ${a}"
  fi

done


#echo -e "{\n${json::-1}\n}"
#echo -e "{\n${json::-1}\n}" | python /home/ivan/pycharm-workplace/agestart/mobile/merge_json.py "/home/ivan/WebstormProjects/race-org/src/i18n/ru.json"
