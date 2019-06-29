const Electron = require('electron');
//tray 系统托盘 添加图标和上下文菜单到系统通知区 资料： https://electronjs.org/docs/all#%E7%B3%BB%E7%BB%9F%E6%89%98%E7%9B%98
const {Menu, Tray} = Electron;

const AutoStart = require('./AutoStart.js');
const WindowManagement = require('./WindowManagement');
const Application = require('./Application.js');
const CONFIG = Application.get();


let TrayController = {
    trayMenu: null,
    tray: null,
    init: () => {
        let template = [
            {
                id: 'show',
                label: '显示',
                click: () => {
                    WindowManagement.showGroup({group: 'main'});
                }
            },
            {
                id: 'up',
                label: '更新',
                click: () => {
                }
            },
            {
                id: 'config',
                label: '设置',
                submenu: [
                    {
                        id: 'autoStart',
                        label: '开机启动',
                        type: 'checkbox',
                        checked: false,
                        visible: false,
                        click: (menuItem) => {
                            AutoStart(menuItem.checked).catch(err => {
                                console.error(err);
                                menuItem.checked = !menuItem.checked;
                                App.refreshTrayMenu();
                            })
                        }
                    }
                ]
            },
            {
                id: 'destroy',
                label: '退出',
                click: () => {
                    WindowManagement.exitAll();
                }
            }
        ];
        App.trayMenu = Menu.buildFromTemplate(template);
        App.tray = new Tray(CONFIG.electron.APP_LOGO_MIN_IMG);

        App.tray.on('click', () => {
            WindowManagement.showGroup({group: 'main'})
        });

        App.tray.setToolTip('MadDragon');
        App.refreshTrayMenu();
        App.syncAutoStartMenu();

    },
    refreshTrayMenu: () => {
        App.tray.setContextMenu(App.trayMenu);
    },
    syncAutoStartMenu: () => {
        let autoStartMenu = App.trayMenu.getMenuItemById('autoStart');
        AutoStart().then(status => {
            autoStartMenu.visible = true;
            autoStartMenu.checked = status;
            App.refreshTrayMenu();
        }).catch(err => {
            if (err !== 'unsupported system') {
                autoStartMenu.visible = true;
                App.refreshTrayMenu();
            }
            console.error('AutoStart', err);
        })
    }
};
let App = TrayController;
module.exports = TrayController;