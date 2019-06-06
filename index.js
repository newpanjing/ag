const electron = require('electron')
const {app, Menu, Tray, Notification, ipcMain, shell, ipcRenderer, BrowserWindow, TouchBar} = electron
const {TouchBarLabel, TouchBarButton, TouchBarSpacer} = TouchBar
const power = require('./power');
const ag = require('./ag');
var fs = require('fs'), os = require('os');

let appIcon = null
app.dock.hide();

let settingWindow = null;
console.log(app.getAppPath())
var client = null;
var tempType = null;

var Sue = require('./Sue').Sue;
var sue = new Sue({
    data: {
        powerType: 0,
        iconText: 'AG',
        powerMappers: {
            'AC Power': '独显',
            'Battery Power': '集显'
        }
    },
    watch: {
        iconText(newValue) {
            if (globalSettings.statusText) {

                appIcon.setTitle(newValue);

            }
        },
        powerType(newValue, oldValue) {
            console.log('电源模式：' + newValue)

            //如果是手动模式，不做任何处理
            if (globalSettings.model.type == 1) {
                return;
            }

            //需要判断下切换模式，自动的情况下
            if (newValue == 'AC Power') {
                ag.set('1');
            } else {
                //电池
                ag.set('0');
            }

            //设置图标
            this.iconText = this.powerMappers[newValue];

            if (client) {
                client.send('data', newValue);
            }

        }
    }
});


function openSettingWindow() {
    if (settingWindow == null) {
        settingWindow = new BrowserWindow({
            width: 550,
            height: 500,
            maximizable: false,
            title: 'AG自动显卡切换',
            webPreferences: {
                nodeIntegration: true
            },
            titleBarStyle: 'hiddenInset'
        })
        // settingWindow.setAlwaysOnTop(true);
        settingWindow.setResizable(false);
        settingWindow.loadFile(`${__dirname}/ui/index.html`)
        settingWindow.setTouchBar(createTouchBar());
        settingWindow.on('close', event => {
            event.preventDefault();
            settingWindow.hide()
            app.dock.hide();
        })
    }
    settingWindow.focus();
    settingWindow.show();
    app.dock.show();

}

function createTouchBar() {
    //判断状态，如果配置文件中不需要就不设置

    var items = []
    if (globalSettings.touchBar) {
        items = [
            new TouchBarButton({
                label: '偏好设置',
                click: () => {
                    selectTouchbar(0);
                }
            }),
            new TouchBarButton({
                label: '授权信息',
                click: () => {
                    selectTouchbar(1);
                }
            }),
            new TouchBarButton({
                label: '版本更新',
                click: () => {
                    selectTouchbar(2);
                }
            }),
            new TouchBarButton({
                label: '关于AG',
                click: () => {
                    selectTouchbar(3);
                }
            }),
            new TouchBarLabel({
                label: '授权至2019年06月05日20:02:28'
            })
        ]
    }

    return new TouchBar({
        items: items
    })
}

function selectTouchbar(index) {
    client.send('switchTab', index);
    //settingWindow._touchBar.items.backgroundColor=''
}

const gotTheLock = app.requestSingleInstanceLock()
var globalSettings = {};

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // 当运行第二个实例时,将会聚焦到myWindow这个窗口
        if (settingWindow) {
            if (settingWindow.isMinimized()) settingWindow.restore()
            settingWindow.focus()
        }
    })

    app.on('ready', () => {

        //打包的情况下
        if (app.isPackaged) {
            if (!app.isInApplicationsFolder()) {
                app.moveToApplicationsFolder();
            }
        }
        //console.log(app.isPackaged)


        appIcon = new Tray(`${__dirname}/res/icon.png`)
        appIcon.setToolTip('自动切换显卡')

        const contextMenu = Menu.buildFromTemplate([
            {
                label: '偏好设置', click() {
                    openSettingWindow();
                }
            },
            {type: 'separator'},
            {
                label: '官网', click() {
                    shell.openExternal('https://newpanjing.github.io/ag/');
                }
            }, {
                label: '检查版本', click() {
                    // shell.openExternal('https://github.com/newpanjing/ag/releases');
                    openSettingWindow();
                    selectTouchbar(2);
                    client.send('checkVersion');
                }
            },
            {type: 'separator'},
            {
                label: '退出', click() {
                    ag.set(2);
                    app.exit(0);
                }
            }
        ])

        // Make a change to the context menu
        contextMenu.items[1].checked = false

        // Call this again for Linux because we modified the context menu
        appIcon.setContextMenu(contextMenu);

        globalSettings = loadSettings();
        if (globalSettings.statusText) {
            appIcon.setTitle(sue.iconText);
        }
        ipcMain.on('command', (event, arg) => {

            var data = {
                version() {
                    return app.getVersion()
                },
                download(url) {
                    shell.openExternal(url);
                },
                settings() {
                    return globalSettings;
                }
            }
            event.returnValue = data[arg.name].call(this, arg.data);
        });


        power.addListener(type => {
            if (client && client.reply) {
                client.reply('data', type);
            }

            tempType = type;

            sue.powerType = type;
        });

        ipcMain.on('register', (event, args) => {
            client = event.sender;
            if (tempType != null) {
                client.send('data', tempType);
            }
        });
        ipcMain.on('openUrl', (event, url) => {
            shell.openExternal(url);
        })
        ipcMain.on('settings', (event, data) => {
            delete data['modelData'];
            changeSettings(data);
        });

        ipcMain.on('restart', (event, data) => {
            app.relaunch({args: process.argv.slice(1).concat(['--relaunch'])})
            app.exit(0)
        });

        openSettingWindow();

    });

//app退出的时候 恢复自动切换显卡
    app.on('quit', () => {
        console.log('quit')
        ag.set(2);
        console.log('切换成功')
    });
    app.on('window-all-closed', () => {
        app.dock.hide();
    })

    // app.setBadgeCount(99)
}
//配置文件保存
var filepath = os.homedir() + '/.ag';

function changeSettings(settings) {
    setModel(settings.model);
    fs.writeFileSync(filepath, JSON.stringify(settings));
}

var latestType = -1;

/**
 * 根据模式来设置显卡模式
 * @param model
 */
function setModel(model) {
    if (model.type == 1) {
        if (model.value != latestType) {
            latestType = model.value;
            console.log(model)

            let mappers = {
                0: '集显',
                1: '独显'
            }
            sue.iconText = mappers[model.value];
            ag.set(model.value);
        }
    }
}

function loadSettings() {
    var exists = fs.existsSync(filepath);
    if (exists) {
        let json = JSON.parse(fs.readFileSync(filepath));
        if (json && json.model) {
            setModel(json.model)
        }
        return json;
    }
    return {};
}