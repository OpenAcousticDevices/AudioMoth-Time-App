/****************************************************************************
 * main.js
 * openacousticdevices.info
 * June 2017
 *****************************************************************************/

'use strict';

/* global process, __dirname */

const {app, Menu, shell, ipcMain, BrowserWindow} = require('electron');

const remoteMain = require('@electron/remote/main');
remoteMain.initialize();

const electronDebug = require('electron-debug');

let mainWindow, aboutWindow;

const path = require('path');

function openAboutWindow () {

    if (aboutWindow) {

        aboutWindow.show();
        return;

    }

    let iconLocation = '/build/icon.ico';

    let windowWidth = 400;
    let windowHeight = 310;

    if (process.platform === 'linux') {

        windowWidth = 395;
        windowHeight = 310;

        iconLocation = '/build/icon.png';

    } else if (process.platform === 'darwin') {

        windowWidth = 395;
        windowHeight = 310;

    }

    aboutWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        title: 'About AudioMoth Time App',
        resizable: false,
        fullscreenable: false,
        minimizable: false,
        useContentSize: true,
        autoHideMenuBar: true,
        icon: path.join(__dirname, iconLocation),
        parent: mainWindow,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            sandbox: false
        }
    });

    aboutWindow.loadFile('about.html');
    aboutWindow.setMenu(null);

    require('@electron/remote/main').enable(aboutWindow.webContents);

    if (!app.isPackaged) {

        electronDebug.openDevTools(aboutWindow);

    }

    aboutWindow.on('close', (e) => {

        e.preventDefault();

        aboutWindow.hide();

    });

    aboutWindow.webContents.on('dom-ready', function () {

        mainWindow.webContents.send('poll-night-mode');

    });

    ipcMain.on('night-mode-poll-reply', (e, nightMode) => {

        if (aboutWindow) {

            aboutWindow.webContents.send('night-mode', nightMode);

        }

    });

}

function toggleNightMode () {

    mainWindow.webContents.send('night-mode');

    if (aboutWindow) {

        aboutWindow.webContents.send('night-mode');

    }

}

app.on('ready', function () {

    const iconLocation = (process.platform === 'linux') ? '/build/icon.png' : '/build/icon.ico';

    let windowWidth = 565;
    let windowHeight = 195;

    if (process.platform === 'darwin') {

        windowWidth = 560;
        windowHeight = 255;

    } else if (process.platform === 'linux') {

        windowWidth = 560;
        windowHeight = 223;

    }

    mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        title: 'AudioMoth Time App',
        resizable: false,
        fullscreenable: false,
        useContentSize: true,
        icon: path.join(__dirname, iconLocation),
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
            backgroundThrottling: false
        }
    });

    // TODO: This line fixes this issue: https://github.com/electron/electron/issues/51465 Check to see if still broken
    mainWindow.setSize(windowWidth, windowHeight);

    require('@electron/remote/main').enable(mainWindow.webContents);

    const menuTemplate = [{
        label: 'File',
        submenu: [{
            type: 'checkbox',
            id: 'nightmode',
            label: 'Night Mode',
            accelerator: 'CommandOrControl+N',
            checked: false,
            click: toggleNightMode
        }, {
            id: 'copyid',
            label: 'Copy Device ID',
            accelerator: 'CommandOrControl+I',
            click: function () {

                mainWindow.webContents.send('copyID');

            },
            enabled: false
        }, {
            type: 'separator'
        }, {
            label: 'Quit',
            accelerator: 'CommandOrControl+Q',
            click: function () {

                app.quit();

            }
        }]
    }, {
        label: 'Help',
        submenu: [{
            label: 'About',
            click: function () {

                openAboutWindow();

            }
        }, {
            label: 'Check For Updates',
            click: function () {

                mainWindow.webContents.send('update-check');

            }
        }, {
            type: 'separator'
        }, {
            label: 'Open Acoustic Devices Website',
            click: function () {

                shell.openExternal('https://openacousticdevices.info');

            }
        }]
    }];

    const menu = Menu.buildFromTemplate(menuTemplate);

    Menu.setApplicationMenu(menu);

    mainWindow.loadFile('index.html');

    if (!app.isPackaged) {

        electronDebug.openDevTools(mainWindow);

    }

});

app.on('window-all-closed', function () {

    app.quit();

});
