const electron = require('electron')
const {app, Menu, Tray, Notification, ipcMain, shell, ipcRenderer, BrowserWindow} = electron
const power = require('./power');
const ag = require('./ag');

let appIcon = null
app.dock.hide();

let settingWindow = null;
console.log(app.getAppPath())

function openSettingWindow() {
    settingWindow = new BrowserWindow({
        width: 520,
        height: 350,
        maximizable: false,
        title: 'AG自动显卡切换',
        webPreferences: {
            nodeIntegration: true
        }
        // titleBarStyle: 'hiddenInset'
    })
    settingWindow.setAlwaysOnTop(true);
    settingWindow.setResizable(false);
    settingWindow.loadFile(`${__dirname}/ui/index.html`)

    settingWindow.show()
    app.dock.show();
}

const gotTheLock = app.requestSingleInstanceLock()

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

        app.setA
        //打包的情况下
        if (app.isPackaged) {
            if (!app.isInApplicationsFolder()) {
                app.moveToApplicationsFolder();
            }
        }
        //console.log(app.isPackaged)

        //让这个版本在7月1日失效，后续授权19.9块钱一年，99终身授权
        openSettingWindow();

        appIcon = new Tray(`${__dirname}/res/icon.png`)
        appIcon.setToolTip('自动切换显卡')
        appIcon.setTitle('AG');
        const contextMenu = Menu.buildFromTemplate([
            {
                label: '偏好设置', click() {
                    openSettingWindow();
                }
            },
            {type: 'separator'},
            {
                label: '官网', click() {
                    shell.openExternal('https://github.com/newpanjing/ag');
                }
            }, {
                label: '检查版本', click() {
                    shell.openExternal('https://github.com/newpanjing/ag/releases');
                }
            },
            {type: 'separator'},
            {
                label: '退出', role: 'quit', click() {
                    console.log('退出')
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
                }
            }
            event.returnValue = data[arg.name].call(this, arg.data);
        });


        power.addListener(type => {
            console.log('电源模式：' + type)
            if (type == 'AC Power') {
                appIcon.setTitle('独显');
                ag.set('1');
            } else {
                //电池
                appIcon.setTitle('集显');
                ag.set('0');
            }
        });

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
