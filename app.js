/****************************************************************************
 * app.js
 * openacousticdevices.info
 * June 2017
 *****************************************************************************/

'use strict';

/* global document */

var electron = require('electron');
var clipboard = electron.remote.clipboard;
var menu = electron.remote.Menu;

var strftime = require('strftime').utc();
var audiomoth = require('audiomoth-hid');

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

    var strftimeUTC = strftime.timezone(0);

    timeDisplay.textContent = strftimeUTC('%H:%M:%S %d/%m/%Y UTC', date);

    timeDisplay.style.color = 'black';

    setTimeButton.disabled = false;

    applicationMenu.getMenuItemById('copyid').enabled = true;

}

/* Device information display functions */

function enableDisplayAndShowBatteryState (batteryState) {

    batteryDisplay.textContent = batteryState;

    batteryDisplay.style.color = 'black';

    batteryLabel.style.color = 'black';

}

function enableDisplayAndShowID (id) {

    idDisplay.textContent = id;

    idDisplay.style.color = 'black';

    idLabel.style.color = 'black';

}

function enableDisplayAndShowVersionNumber (version) {

    firmwareVersionDisplay.textContent = version;

    firmwareVersionDisplay.style.color = 'black';

    firmwareVersionLabel.style.color = 'black';

}

function enableDisplayAndShowVersionDescription (description) {

    firmwareDescriptionDisplay.textContent = description;

    firmwareDescriptionDisplay.style.color = 'black';

    firmwareDescriptionLabel.style.color = 'black';

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

            enableDisplayAndShowVersionDescription(description);

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

            enableDisplayAndShowVersionNumber(versionArr[0] + '.' + versionArr[1] + '.' + versionArr[2]);

            requestFirmwareDescription();

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

            enableDisplayAndShowBatteryState(batteryState);

            requestFirmwareVersion();

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

            enableDisplayAndShowID(id);

            requestBatteryState();

        }

    });

}

function requestTime () {

    audiomoth.getTime(function (err, date) {

        if (err) {

            errorOccurred(err);

        } else if (date === null) {

            disableDisplay();

        } else {

            enableDisplayAndShowTime(date);

            requestID();

        }

        setTimeout(requestTime, 1000);

    });

}

function setTime () {

    audiomoth.setTime(new Date(), function (err, date) {

        if (err) {

            errorOccurred(err);

        } else if (date === null) {

            disableDisplay();

        } else {

            enableDisplayAndShowTime(date);

            setTimeButton.style.color = 'green';
            setTimeout(function () {

                setTimeButton.style.color = '';

            }, 1000);

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

/* Main code entry point */

disableDisplay();

initialiseDisplay();

setTimeButton.addEventListener('click', setTime);

requestTime();
