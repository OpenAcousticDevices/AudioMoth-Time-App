# AudioMoth Time App #

An Electron-based application capable of setting the on-board clock of the AudioMoth recording device.
For more details on the device itself, visit [www.openacousticdevices.info](http://www.openacousticdevices.info).

### Usage ###
Once the repository has been cloned, you must either have electron-builder installed globally, or get it for the app specifically by running:
```
npm install
```

From then onwards, or if you already had electron-builder installed, start the application with:
```
npm run start 
```

Package the application into an installer for your current platform with:
```
npm run dist
```
This will place a packaged version of the app and an installer for the platform this command was run on into the `/dist` folder.

### Related Repositories ###
* [AudioMoth-HID](https://github.com/OpenAcousticDevices/AudioMoth-HID)
* [AudioMoth Configuration App](https://github.com/OpenAcousticDevices/AudioMoth-Configuration-App)

### License ###

Copyright 2017 [Open Acoustic Devices](http://www.openacousticdevices.info/).

[MIT license](http://www.openacousticdevices.info/license).
