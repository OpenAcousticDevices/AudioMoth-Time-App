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

    var aboutWindow = new BrowserWindow({
        width: 400,
        height: 325,
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, "/build/icon.ico")
    });

    aboutWindow.setMenu(null);
    aboutWindow.loadURL("file://" + __dirname + "/about.html");

}

app.on('ready', function () {

    var mainWindow, menuTemplate, menu, windowHeight;

    if (process.platform === 'darwin') {
        windowHeight = 306;
    } else if (process.platform === 'linux') {
        windowHeight = 308;
    } else {
        windowHeight = 330;
    }

    mainWindow = new BrowserWindow({
        width: 565,
        height: windowHeight,
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, "/build/icon.ico")
    });

    menuTemplate = [{
        label: "File",
        submenu: [{
            label: "Quit",
            accelerator: "CommandOrControl+Q",
            click: function () {
                app.quit();
            }
        }]
    }, {
        label: "Help",
        submenu: [{
            label: "Open Acoustic Devices website",
            click: function () {
                shell.openExternal("https://openacousticdevices.info");
            }
        }, {
            label: "About",
            click: function () {
                openAboutWindow();
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