/****************************************************************************
 * app.js
 * openacousticdevices.info
 * June 2017
 *****************************************************************************/

'use strict';

/*global document */

var strftime = require('strftime').utc();
var audiomoth = require('audiomoth-hid');

/* UI components */

var timeDisplay = document.getElementById('time-display');
var idDisplay = document.getElementById('id-display');
var batteryDisplay = document.getElementById('battery-display');

var setTimeButton = document.getElementById('set-time-button');

/* Time display functions */

function initialiseDisplay() {

    timeDisplay.value = "00:00:00 01/01/1970";

}

function disableDisplay() {

    timeDisplay.style.color = "lightgrey";

    idDisplay.style.color = "lightgrey";

    batteryDisplay.style.color = "lightgrey";

    setTimeButton.disabled = true;

    initialiseDisplay();

}

function enableDisplayAndShowTime(date) {

    var strftimeUTC = strftime.timezone(0);

    timeDisplay.textContent = strftimeUTC("%H:%M:%S %d/%m/%Y", date);

    timeDisplay.style.color = "black";

    setTimeButton.disabled = false;

}

/* Battery display functions */

function enableDisplayAndShowBatteryState(batteryState) {

    batteryDisplay.textContent = batteryState;

    batteryDisplay.style.color = "black";

}

/* ID display functions */

function enableDisplayAndShowID(id) {

    if (idDisplay !== id) {

        idDisplay.value = id;

    }

    idDisplay.style.color = "black";

}

/* Error response */

function errorOccurred(err) {

    console.error(err);

    disableDisplay();

}


/* Device interaction functions */

function requestBatteryState() {

    audiomoth.getBatteryState(function (err, batteryState) {

        if (err) {

            errorOccurred(err);

        } else if (batteryState === null) {

            disableDisplay();

        } else {

            enableDisplayAndShowBatteryState(batteryState);

        }

    });

}

function requestID() {

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

function requestTime() {

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

function setTime() {

    audiomoth.setTime(new Date(), function (err, date) {

        if (err) {

            errorOccurred(err);

        } else if (date === null) {

            disableDisplay();

        } else {

            enableDisplayAndShowTime(date);

            setTimeButton.style.color = "green";
            setTimeout(function () {
                setTimeButton.style.color = "";
            }, 1000);

        }

    });

}

/* Main code entry point */

disableDisplay();

initialiseDisplay();

setTimeButton.addEventListener('click', setTime);

setTimeout(requestTime, 1000);