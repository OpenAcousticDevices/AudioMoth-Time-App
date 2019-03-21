/****************************************************************************
 * main.js
 * openacousticdevices.info
 * June 2017
 *****************************************************************************/

'use strict';

/*jslint nomen: true*/

var electron = require('electron');
var app = electron.app;

var BrowserWindow = electron.BrowserWindow;
var Menu = electron.Menu;
var shell = electron.shell;

require('electron-debug')({
    showDevTools: "undocked"
});

var path = require('path');

function openAboutWindow() {

    var aboutWindow, iconLocation;

    iconLocation = "/build/icon.ico";

    if (process.platform === 'linux') {
        iconLocation = "/build/icon.png";
    }

    aboutWindow = new BrowserWindow({
        width: 400,
        height: 325,
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, iconLocation)
    });

    aboutWindow.setMenu(null);
    aboutWindow.loadURL("file://" + __dirname + "/about.html");

}

app.on('ready', function () {

    var mainWindow, menuTemplate, menu, windowHeight, iconLocation;

    iconLocation = "/build/icon.ico";

    if (process.platform === 'darwin') {
        windowHeight = 245;
    } else if (process.platform === 'linux') {
        windowHeight = 247;
        iconLocation = "/build/icon.png";
    } else {
        windowHeight = 269;
    }

    mainWindow = new BrowserWindow({
        width: 565,
        height: windowHeight,
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, iconLocation)
    });

    menuTemplate = [{
        label: "File",
        submenu: [{
            id: "copyid",
            label: "Copy Device ID",
            accelerator: "CommandOrControl+I",
            click: function () {
                mainWindow.webContents.send("copyID");
            },
            enabled: false
        }, {
            type: 'separator'
        }, {
            label: "Quit",
            accelerator: "CommandOrControl+Q",
            click: function () {
                app.quit();
            }
        }]
    }, {
        label: "Help",
        submenu: [{
            label: "About",
            click: function () {
                openAboutWindow();
            }
        }, {
            type: 'separator'
        }, {
            label: "Open Acoustic Devices Website",
            click: function () {
                shell.openExternal("https://openacousticdevices.info");
            }
        }]
    }];

    menu = Menu.buildFromTemplate(menuTemplate);

    Menu.setApplicationMenu(menu);

    mainWindow.loadURL("file://" + __dirname + "/index.html");

});

app.on('window-all-closed', function () {
    app.quit();
});