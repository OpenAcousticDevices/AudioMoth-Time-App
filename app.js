/****************************************************************************
 * app.js
 * openacousticdevices.info
 * June 2017
 *****************************************************************************/

'use strict';

/* global document */

const electron = require('electron');
const {clipboard, Menu, dialog, getCurrentWindow} = require('@electron/remote');

const util = require('util');
const strftime = require('strftime').utc();
const audiomoth = require('audiomoth-hid');

const versionChecker = require('./versionChecker.js');
const nightMode = require('./nightMode.js');
require('worker_threads');

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

/* Whether or not communication with device is currently happening */

let communicating = false;

/* Communication constants */

const MAXIMUM_RETRIES = 10;
const DEFAULT_RETRY_INTERVAL = 100;
const DEFAULT_REQUEST_OFFSET = 100;

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

    if (communicating) return;

    const strftimeUTC = strftime.timezone(0);

    timeDisplay.textContent = strftimeUTC('%H:%M:%S %d/%m/%Y UTC', date);

    timeDisplay.classList.remove('grey');

    setTimeButton.disabled = false;

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

    applicationMenu.getMenuItemById('copyid').enabled = true;

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

/* Utility functions */

async function callWithRetry (funcSync, argument, milliseconds, repeats) {

    let result;

    let attempt = 0;

    while (attempt < repeats) {

        try {

            if (argument) {

                result = await funcSync(argument);

            } else {

                result = await funcSync();

            }

            break;

        } catch (e) {

            const interval = milliseconds / 2 + milliseconds / 2 * Math.random();

            await delay(interval);

            attempt += 1;

        }

    }

    if (result === undefined) throw ('Error: Repeated attempts to access the device failed.');

    if (result === null) throw ('No device detected');

    return result;

}

async function delay (milliseconds) {

    return new Promise(resolve => setTimeout(resolve, milliseconds));

}

/* Promisified versions of AudioMoth-HID calls */

const getFirmwareDescription = util.promisify(audiomoth.getFirmwareDescription);

const getFirmwareVersion = util.promisify(audiomoth.getFirmwareVersion);

const getBatteryState = util.promisify(audiomoth.getBatteryState);

const getID = util.promisify(audiomoth.getID);

const getTime = util.promisify(audiomoth.getTime);

const setTime = util.promisify(audiomoth.setTime);

/* Device interaction functions */

async function requestAudioMothTime () {

    try {

        /* Read from AudioMoth */

        const date = await callWithRetry(getTime, null, DEFAULT_RETRY_INTERVAL, MAXIMUM_RETRIES);

        const id = await callWithRetry(getID, null, DEFAULT_RETRY_INTERVAL, MAXIMUM_RETRIES);

        const description = await callWithRetry(getFirmwareDescription, null, DEFAULT_RETRY_INTERVAL, MAXIMUM_RETRIES);

        const versionArr = await callWithRetry(getFirmwareVersion, null, DEFAULT_RETRY_INTERVAL, MAXIMUM_RETRIES);

        const batteryState = await callWithRetry(getBatteryState, null, DEFAULT_RETRY_INTERVAL, MAXIMUM_RETRIES);

        /* No exceptions have occurred so update display */

        const firmwareVersion = versionArr[0] + '.' + versionArr[1] + '.' + versionArr[2];

        enableDisplayAndShowTime(date);
        enableDisplayAndShowID(id);
        enableDisplayAndShowVersionDescription(description);
        enableDisplayAndShowVersionNumber(firmwareVersion);
        enableDisplayAndShowBatteryState(batteryState);

    } catch (e) {

        /* Problem reading from AudioMoth or no AudioMoth */

        disableDisplay();

    }

    const milliseconds = Date.now() % MILLISECONDS_IN_SECOND;

    let delay = DEFAULT_REQUEST_OFFSET - milliseconds;

    if (delay < 0) delay += MILLISECONDS_IN_SECOND;

    setTimeout(requestAudioMothTime, delay);

}

async function setAudioMothTime (time) {

    try {

        await callWithRetry(setTime, time, DEFAULT_RETRY_INTERVAL, MAXIMUM_RETRIES);

    } catch (e) {

        disableDisplay();

    }

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

    timeDisplay.classList.add('grey');

    const USB_LAG = 20;

    const MINIMUM_DELAY = 100;

    const MILLISECONDS_IN_SECOND = 1000;

    /* Increment to next second transition */

    const sendTime = new Date();

    let delay = MILLISECONDS_IN_SECOND - sendTime.getMilliseconds();

    if (delay < MINIMUM_DELAY) delay += MILLISECONDS_IN_SECOND;

    sendTime.setMilliseconds(sendTime.getMilliseconds() + delay);

    /* Calculate how long to wait until second transition */

    const now = new Date();

    const sendTimeDiff = sendTime.getTime() - now.getTime() - USB_LAG;

    /* Calculate when to re-enable time display */

    communicating = true;

    setTimeButton.disabled = true;

    const updateDelay = sendTimeDiff <= 0 ? MILLISECONDS_IN_SECOND / 2: sendTimeDiff + MILLISECONDS_IN_SECOND / 2;

    setTimeout(function () {

        communicating = false;

    }, updateDelay);

    /* Either send immediately or wait until the transition */

    if (sendTimeDiff <= 0) {

        console.log('Sending now.');

        setAudioMothTime(sendTime);

    } else {

        console.log('Sending in', sendTimeDiff,'ms.');

        setTimeout(function () {

            setAudioMothTime(sendTime);

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

requestAudioMothTime();
