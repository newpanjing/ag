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
    return new TouchBar({
        items: [
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
        globalSettings = loadSettings();
        //打包的情况下
        if (app.isPackaged) {
            if (!app.isInApplicationsFolder()) {
                app.moveToApplicationsFolder();
            }
        }
        //console.log(app.isPackaged)


        appIcon = new Tray(`${__dirname}/res/icon.png`)
        appIcon.setToolTip('自动切换显卡')
        if (globalSettings.statusText) {
            appIcon.setTitle('AG');
        }
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

        ipcMain.on('command', (event, arg) => {

            var data = {
                version() {
                    return app.getVersion()
                },
                download(url) {
                    shell.openExternal(url);
                },
                settings(){
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
            str = '';
            console.log('电源模式：' + type)
            if (type == 'AC Power') {
                str = '独显';
                ag.set('1');
            } else {
                //电池
                ag.set('0');
                str = '集显';
            }
            if (globalSettings.statusText) {
                appIcon.setTitle(str);
            }
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
    fs.writeFileSync(filepath, JSON.stringify(settings));
}


function loadSettings() {
    var exists = fs.existsSync(filepath);
    if (exists) {
        return JSON.parse(fs.readFileSync(filepath));
    }
    return {};
}