const Electron = require('electron');
//tray 系统托盘 添加图标和上下文菜单到系统通知区 资料： https://electronjs.org/docs/all#%E7%B3%BB%E7%BB%9F%E6%89%98%E7%9B%98
const {Menu, Tray} = Electron;
//  自动启动
const AutoStart = require('./AutoStart.js');
const UpdateApp = require('./UpdateApp.js');
const WindowManagement = require('./WindowManagement');
const Application = require('./Application.js');
const CONFIG = Application.get();

// 将图标和上下文菜单添加到系统的通知区域。 -- 控制器
const TrayController = {
    trayMenu: null,
    tray: null,
    init: () => {
        let template = [
            {
                id: 'show',
                label: '显示',
                click: () => {
                    // 显示 同一分组 所有窗口
                    WindowManagement.showGroup({group: 'main'});
                }
            },
            {
                id: 'up',
                label: '更新',
                click: () => {
                    UpdateApp.check();
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
                            // 设置开机自启动
                            AutoStart(menuItem.checked).catch(err => {
                                console.error(err);
                                menuItem.checked = !menuItem.checked;
                                // 设置此图标的上下文菜单。
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
                    // 强制关闭 所有 视图
                    WindowManagement.exitAll();
                }
            }
        ];
        // Menu.buildFromTemplate(template) 您还可以将其他字段附加到该元素，template并且它们将成为构建的菜单项的属性。
        App.trayMenu = Menu.buildFromTemplate(template);
        // new Tray(image) 创建一个与该关联的新托盘图标image。
        // CONFIG.electron.APP_LOGO_MIN_IMG ICON 地址
        App.tray = new Tray(CONFIG.electron.APP_LOGO_MIN_IMG);

        // 在 托盘图片上添加点击事件
        App.tray.on('click', () => {
            // 显示 同一分组 所有窗口
            WindowManagement.showGroup({group: 'main'})
        });
        // 设置此托盘图标的悬停文本。
        App.tray.setToolTip('MadDragon');
        App.refreshTrayMenu();
        // 同步自动启动菜单
        App.syncAutoStartMenu();

    },
    // 设置此图标的上下文菜单。
    refreshTrayMenu: () => {
        // tray.setContextMenu(menu) 设置此图标的上下文菜单。
        App.tray.setContextMenu(App.trayMenu);
    },
    // 同步自动启动菜单
    syncAutoStartMenu: () => {
        let autoStartMenu = App.trayMenu.getMenuItemById('autoStart');
        // 自动启动
        AutoStart().then(status => {
            // visible 一个Boolean指示项目是否可见，此属性可以动态更改。
            autoStartMenu.visible = true;
            // checked 一个 Boolean表示是否选中该项目，该属性可以动态更改。
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