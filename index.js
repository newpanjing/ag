console.log('ok')
const electron = require('electron')
const {app, Menu, Tray, Notification} = electron


let appIcon = null
app.dock.hide();
app.on('ready', () => {
    appIcon = new Tray('./res/icon.png')
    appIcon.setToolTip('自动切换显卡')
    const contextMenu = Menu.buildFromTemplate([
        {label: '独立显卡', type: 'radio'},
        {label: '集成显卡', type: 'radio'}
    ])

    // Make a change to the context menu
    contextMenu.items[1].checked = false

    // Call this again for Linux because we modified the context menu
    appIcon.setContextMenu(contextMenu)
    /*
        var notification = new Notification([{
            'title': '测试title',
            'body': 'body',
            'subtitle': 'subtitle',
            'icon': './res/icon.png',
            'closeButtonText': '关闭'
        }]);
        setInterval(_ => notification.show(), 2000, 0);*/

});
