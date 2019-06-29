const Electron = require('electron');
//tray 系统托盘 添加图标和上下文菜单到系统通知区 资料： https://electronjs.org/docs/all#%E7%B3%BB%E7%BB%9F%E6%89%98%E7%9B%98
const {Menu, Tray} = Electron;


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
    }
};
let App = TrayController;
module.exports = TrayController;