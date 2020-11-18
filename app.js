/****************************************************************************
 * app.js
 * openacousticdevices.info
 * June 2017
 *****************************************************************************/

'use strict';

/* global document */

const electron = require('electron');
const clipboard = electron.remote.clipboard;
const menu = electron.remote.Menu;
const dialog = electron.remote.dialog;

const strftime = require('strftime').utc();
const audiomoth = require('audiomoth-hid');

const versionChecker = require('./versionChecker.js');

/* UI components */

var applicationMenu = menu.getApplicationMenu();

var timeDisplay = document.getElementById('time-display');
var idLabel = document.getElementById('id-label');
var idDisplay = document.getElementById('id-display');
var firmwareVersionLabel = document.getElementById('firmware-version-label');
var firmwareVersionDisplay = document.getElementById('firmware-version-display');
var firmwareDescriptionLabel = document.getElementById('firmware-description-label');
var firmwareDescriptionDisplay = document.getElementById('firmware-description-display');
var batteryLabel = document.getElementById('battery-label');
var batteryDisplay = document.getElementById('battery-display');

var setTimeButton = document.getElementById('set-time-button');

var communicating = false;

var currentTime, deviceId, firmwareVersion, firmwareDescription;

/* Time display functions */

function initialiseDisplay () {

    timeDisplay.textContent = '00:00:00 01/01/1970 UTC';

}

function disableDisplay () {

    timeDisplay.style.color = 'lightgrey';

    idDisplay.style.color = 'lightgrey';

    idLabel.style.color = 'lightgrey';

    firmwareVersionDisplay.style.color = 'lightgrey';

    firmwareVersionLabel.style.color = 'lightgrey';

    firmwareDescriptionDisplay.style.color = 'lightgrey';

    firmwareDescriptionLabel.style.color = 'lightgrey';

    batteryDisplay.style.color = 'lightgrey';

    batteryLabel.style.color = 'lightgrey';

    setTimeButton.disabled = true;

    applicationMenu.getMenuItemById('copyid').enabled = false;

}

function enableDisplayAndShowTime (date) {

    if (communicating) {

        return;

    }

    var strftimeUTC = strftime.timezone(0);

    timeDisplay.textContent = strftimeUTC('%H:%M:%S %d/%m/%Y UTC', date);

    timeDisplay.style.color = '';

    setTimeButton.disabled = false;

    applicationMenu.getMenuItemById('copyid').enabled = true;

}

/* Device information display functions */

function enableDisplayAndShowBatteryState (batteryState) {

    batteryDisplay.textContent = batteryState;

    batteryDisplay.style.color = '';

    batteryLabel.style.color = '';

}

function enableDisplayAndShowID (id) {

    idDisplay.textContent = id;

    idDisplay.style.color = '';

    idLabel.style.color = '';

}

function enableDisplayAndShowVersionNumber (version) {

    firmwareVersionDisplay.textContent = version;

    firmwareVersionDisplay.style.color = '';

    firmwareVersionLabel.style.color = '';

}

function enableDisplayAndShowVersionDescription (description) {

    firmwareDescriptionDisplay.textContent = description;

    firmwareDescriptionDisplay.style.color = '';

    firmwareDescriptionLabel.style.color = '';

}

/* Error response */

function errorOccurred (err) {

    console.error(err);

    disableDisplay();

}

/* Device interaction functions */

function requestFirmwareDescription () {

    audiomoth.getFirmwareDescription(function (err, description) {

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

    if (communicating) {

        return;

    }

    audiomoth.getTime(function (err, date) {

        if (err) {

            errorOccurred(err);

        } else if (date === null) {

            disableDisplay();

        } else {

            currentTime = date;

            requestID();

        }

        setTimeout(requestTime, 300);

    });

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

electron.ipcRenderer.on('copyID', function () {

    clipboard.writeText(idDisplay.textContent);
    idDisplay.style.color = 'green';

    setTimeout(function () {

        idDisplay.style.color = '';

    }, 5000);

});

electron.ipcRenderer.on('update-check', function () {

    versionChecker.checkLatestRelease(function (response) {

        var buttonIndex;

        if (response.error) {

            console.error(response.error);

            dialog.showMessageBox(electron.remote.getCurrentWindow(), {
                type: 'error',
                title: 'Failed to check for updates',
                message: response.error
            });

            return;

        }

        if (response.updateNeeded === false) {

            dialog.showMessageBox(electron.remote.getCurrentWindow(), {
                type: 'info',
                title: 'Update not needed',
                message: 'Your app is on the latest version (' + response.latestVersion + ').'
            });

            return;

        }

        buttonIndex = dialog.showMessageBoxSync({
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

    var sendTime, now, delay, sendTimeDiff, USB_LAG, MINIMUM_DELAY, MILLISECONDS_IN_SECOND;

    communicating = true;
    timeDisplay.style.color = 'lightgrey';

    USB_LAG = 20;

    MINIMUM_DELAY = 100;

    MILLISECONDS_IN_SECOND = 1000;

    /* Update button */

    setTimeButton.disabled = true;

    setTimeout(function () {

        communicating = false;

        requestTime();

        setTimeButton.disabled = false;

    }, 1500);

    /* Increment to next second transition */

    sendTime = new Date();

    delay = MILLISECONDS_IN_SECOND - sendTime.getMilliseconds() - USB_LAG;

    if (delay < MINIMUM_DELAY) delay += MILLISECONDS_IN_SECOND;

    sendTime.setMilliseconds(sendTime.getMilliseconds() + delay);

    /* Calculate how long to wait until second transition */

    now = new Date();
    sendTimeDiff = sendTime.getTime() - now.getTime();

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

requestTime();
