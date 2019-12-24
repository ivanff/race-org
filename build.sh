#!/bin/bash

adb devices | tail -n +2 | cut -sf 1 | grep  -v -E emu

echo 'Continue'
read varname


time=$(date +"%m-%d-%Y_%H-%M")
filename="race_org.0.1.${time}.apk"

echo $filename

tns platform update android

cp ./src/i18n/ru.json ./src/i18n/uk.json
cp ./src/i18n/ru.json ./src/i18n/be.json

tns build android --release --env.snapshot --env.uglify --env.aot --key-store-path ./key_store/upload_keystore.jks --key-store-password siKiyas9 --key-store-alias upload --key-store-alias-password siKiyas9 --aab --copy-to $filename.aab
tns build android --release --env.snapshot --env.uglify --env.aot --key-store-path ./key_store/upload_keystore.jks --key-store-password siKiyas9 --key-store-alias upload --key-store-alias-password siKiyas9 --copy-to $filename
cp $filename race_org.latest.apk
cp $filename.aab race_org.latest.aab
adb devices | tail -n +2 | cut -sf 1 | grep  -v -E emu | xargs -iX adb -s X uninstall org.nativescript.raceorg
adb devices | tail -n +2 | cut -sf 1 | grep  -v -E emu | xargs -iX adb -s X install -r race_org.latest.aab

#gsutil cp race_org.latest.apk gs://race-org.appspot.com/android_builds/
cp race_org.latest.apk ./src/assets/data/

ng build --prod && firebase deploy --only hosting
