/****************************************************************************
 * app.js
 * openacousticdevices.info
 * June 2017
 *****************************************************************************/

'use strict';

/* global document */

const electron = require('electron');
const {clipboard, Menu, dialog, getCurrentWindow} = require('@electron/remote');

const strftime = require('strftime').utc();
const audiomoth = require('audiomoth-hid');

const versionChecker = require('./versionChecker.js');
const nightMode = require('./nightMode.js');

/* UI components */

const applicationMenu = Menu.getApplicationMenu();

const timeDisplay = document.getElementById('time-display');
const idLabel = document.getElementById('id-label');
const idDisplay = document.getElementById('id-display');
const firmwareVersionLabel = document.getElementById('firmware-version-label');
const firmwareVersionDisplay = document.getElementById('firmware-version-display');
const firmwareDescriptionLabel = document.getElementById('firmware-description-label');
const firmwareDescriptionDisplay = document.getElementById('firmware-description-display');
const batteryLabel = document.getElementById('battery-label');
const batteryDisplay = document.getElementById('battery-display');

const setTimeButton = document.getElementById('set-time-button');

const MILLISECONDS_IN_SECOND = 1000;

let communicating = false;

let currentTime, deviceId, firmwareVersion, firmwareDescription;

/* Time display functions */

function initialiseDisplay () {

    timeDisplay.textContent = '--:--:-- --/--/---- UTC';

}

function disableDisplay () {

    timeDisplay.classList.add('grey');

    idDisplay.classList.add('grey');

    idLabel.classList.add('grey');

    firmwareVersionDisplay.classList.add('grey');

    firmwareVersionLabel.classList.add('grey');

    firmwareDescriptionDisplay.classList.add('grey');

    firmwareDescriptionLabel.classList.add('grey');

    batteryDisplay.classList.add('grey');

    batteryLabel.classList.add('grey');

    setTimeButton.disabled = true;

}

function enableDisplayAndShowTime (date) {

    if (communicating) {

        return;

    }

    const strftimeUTC = strftime.timezone(0);

    timeDisplay.textContent = strftimeUTC('%H:%M:%S %d/%m/%Y UTC', date);

    timeDisplay.classList.remove('grey');

    setTimeButton.disabled = false;

    applicationMenu.getMenuItemById('copyid').enabled = true;

}

/* Device information display functions */

function enableDisplayAndShowBatteryState (batteryState) {

    batteryDisplay.textContent = batteryState;

    batteryDisplay.classList.remove('grey');

    batteryLabel.classList.remove('grey');

}

function enableDisplayAndShowID (id) {

    idDisplay.textContent = id;

    idDisplay.classList.remove('grey');

    idLabel.classList.remove('grey');

}

function enableDisplayAndShowVersionNumber (version) {

    firmwareVersionDisplay.textContent = version;

    firmwareVersionDisplay.classList.remove('grey');

    firmwareVersionLabel.classList.remove('grey');

}

function enableDisplayAndShowVersionDescription (description) {

    firmwareDescriptionDisplay.textContent = description;

    firmwareDescriptionDisplay.classList.remove('grey');

    firmwareDescriptionLabel.classList.remove('grey');

}

/* Error response */

function errorOccurred (err) {

    console.error(err);

    disableDisplay();

}

/* Device interaction functions */

function requestFirmwareDescription () {

    audiomoth.getFirmwareDescription(function (err, description) {

        if (communicating) return;

        if (err) {

            errorOccurred(err);

        } else if (description === null) {

            disableDisplay();

        } else {

            firmwareDescription = description;

            requestFirmwareVersion();

        }

    });

}

function requestFirmwareVersion () {

    audiomoth.getFirmwareVersion(function (err, versionArr) {

        if (communicating) return;

        if (err) {

            errorOccurred(err);

        } else if (versionArr === null) {

            disableDisplay();

        } else {

            firmwareVersion = versionArr[0] + '.' + versionArr[1] + '.' + versionArr[2];

            requestBatteryState();

        }

    });

}

function requestBatteryState () {

    audiomoth.getBatteryState(function (err, batteryState) {

        if (communicating) return;

        if (err) {

            errorOccurred(err);

        } else if (batteryState === null) {

            disableDisplay();

        } else {

            enableDisplayAndShowTime(currentTime);
            enableDisplayAndShowID(deviceId);
            enableDisplayAndShowVersionDescription(firmwareDescription);
            enableDisplayAndShowVersionNumber(firmwareVersion);
            enableDisplayAndShowBatteryState(batteryState);

        }

    });

}

function requestID () {

    audiomoth.getID(function (err, id) {

        if (communicating) return;

        if (err) {

            errorOccurred(err);

        } else if (id === null) {

            disableDisplay();

        } else {

            deviceId = id;

            requestFirmwareDescription();

        }

    });

}

function requestTime () {

    if (communicating) return;

    audiomoth.getTime(function (err, date) {

        if (communicating) return;

        if (err) {

            errorOccurred(err);

        } else if (date === null) {

            disableDisplay();

        } else {

            currentTime = date;

            requestID();

        }

    });

    const milliseconds = Date.now() % MILLISECONDS_IN_SECOND;

    let delay = MILLISECONDS_IN_SECOND / 2 - milliseconds;

    if (delay < 0) delay += MILLISECONDS_IN_SECOND;

    setTimeout(requestTime, delay);

}

function setTime (time) {

    audiomoth.setTime(time, function (err, date) {

        if (err) {

            errorOccurred(err);

        } else if (date === null) {

            disableDisplay();

        } else {

            enableDisplayAndShowTime(date);

        }

    });

}

electron.ipcRenderer.on('copyID', () => {

    clipboard.writeText(idDisplay.textContent);
    idDisplay.style.color = 'green';

    setTimeout(() => {

        idDisplay.style.color = '';

    }, 2000);

});

electron.ipcRenderer.on('update-check', function () {

    versionChecker.checkLatestRelease(function (response) {

        if (response.error) {

            console.error(response.error);

            dialog.showMessageBox(getCurrentWindow(), {
                type: 'error',
                title: 'Failed to check for updates',
                message: response.error
            });

            return;

        }

        if (response.updateNeeded === false) {

            dialog.showMessageBox(getCurrentWindow(), {
                type: 'info',
                title: 'Update not needed',
                message: 'Your app is on the latest version (' + response.latestVersion + ').'
            });

            return;

        }

        const buttonIndex = dialog.showMessageBoxSync({
            type: 'warning',
            buttons: ['Yes', 'No'],
            title: 'Are you sure?',
            message: 'A newer version of this app is available (' + response.latestVersion + '), would you like to download it?'
        });

        if (buttonIndex === 0) {

            electron.shell.openExternal('https://www.openacousticdevices.info/applications');

        }

    });

});

/* Main code entry point */

disableDisplay();

initialiseDisplay();

setTimeButton.addEventListener('click', function () {

    communicating = true;

    timeDisplay.classList.add('grey');

    const USB_LAG = 20;

    const MINIMUM_DELAY = 100;

    const MILLISECONDS_IN_SECOND = 1000;

    /* Update button */

    setTimeButton.disabled = true;

    setTimeout(function () {

        communicating = false;

        requestTime();

        setTimeButton.disabled = false;

    }, 1500);

    /* Increment to next second transition */

    const sendTime = new Date();

    let delay = MILLISECONDS_IN_SECOND - sendTime.getMilliseconds() - USB_LAG;

    if (delay < MINIMUM_DELAY) delay += MILLISECONDS_IN_SECOND;

    sendTime.setMilliseconds(sendTime.getMilliseconds() + delay);

    /* Calculate how long to wait until second transition */

    const now = new Date();
    const sendTimeDiff = sendTime.getTime() - now.getTime();

    /* Either send immediately or wait until the transition */

    if (sendTimeDiff <= 0) {

        setTime(sendTime);

    } else {

        console.log('Sending in', sendTimeDiff);

        setTimeout(function () {

            setTime(sendTime);

        }, sendTimeDiff);

    }

});

electron.ipcRenderer.on('night-mode', (e, nm) => {

    if (nm !== undefined) {

        nightMode.setNightMode(nm);

    } else {

        nightMode.toggle();

    }

});

electron.ipcRenderer.on('poll-night-mode', () => {

    electron.ipcRenderer.send('night-mode-poll-reply', nightMode.isEnabled());

});

requestTime();
