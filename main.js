/****************************************************************************
 * main.js
 * openacousticdevices.info
 * June 2017
 *****************************************************************************/

'use strict';

const {app, Menu, shell, ipcMain, BrowserWindow} = require('electron');

require('@electron/remote/main').initialize();

let mainWindow, aboutWindow;

require('electron-debug')({
    showDevTools: 'undocked'
});

const path = require('path');

function openAboutWindow () {

    let iconLocation = '/build/icon.ico';

    if (process.platform === 'linux') {

        iconLocation = '/build/icon.png';

    }

    aboutWindow = new BrowserWindow({
        width: 400,
        height: 325,
        title: 'About AudioMoth Time App',
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, iconLocation),
        parent: mainWindow,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    aboutWindow.setMenu(null);
    aboutWindow.loadURL(path.join('file://', __dirname, '/about.html'));

    require('@electron/remote/main').enable(aboutWindow.webContents);

    aboutWindow.on('closed', () => {

        aboutWindow = null;

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

    let iconLocation = '/build/icon.ico';

    let windowHeight = 250;

    if (process.platform === 'darwin') {

        windowHeight = 227;

    } else if (process.platform === 'linux') {

        windowHeight = 230;
        iconLocation = '/build/icon.png';

    }

    mainWindow = new BrowserWindow({
        width: 565,
        height: windowHeight,
        useContentSize: true,
        title: 'AudioMoth Time App',
        resizable: false,
        fullscreenable: false,
        icon: path.join(__dirname, iconLocation),
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false
        }
    });

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

    mainWindow.loadURL(path.join('file://', __dirname, '/index.html'));

});

app.on('window-all-closed', function () {

    app.quit();

});
