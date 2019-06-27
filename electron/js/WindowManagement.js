const Utils = require('../libs/utils');
/**
 * Menu 菜单 https://electronjs.org/docs/api/menu#menusetapplicationmenumenu
 */
const {BrowserWindow, Menu, dialog} = require('electron');
const Application = require('./Application');
const CONFIG = Application.get();
const CONFIG_WINDOW = CONFIG.electron.WINDOW;
const DEFAULT_OPTION = JSON.stringify(CONFIG_WINDOW.DEFAULT_OPTION);


// window 菜单管理控制器
const WindowManagementController = {
    ID_KEY: '__id__',
    windowNodePool: {},
    start: () => {
        /**
         * Menu.setApplicationMenu(menu) 当在MacOS、Windows、Linux中使用menu设置程序菜单时，会设置在各个程序窗体的顶层。
         * 资料： https://electronjs.org/docs/api/menu#menusetapplicationmenumenu
         * 设置菜单
         */
        Menu.setApplicationMenu(null);
        const startList = CONFIG_WINDOW.START;
        if (Utils.list.isEmpty(startList)) {
            App.startEmpty();
            return;
        }
        startList.forEach((windowNodeConfig) => {
            App.open(windowNodeConfig)
        })
    },
    startEmpty: () => {
        App.open({
            id: 'empty',
            file: './electron/index.html'
        })
    },
    getWin: ({id}) => {
        if (Utils.string.isBlank(id)) return null;
        const windoNode = App.windowNodePool[id];
        if (!windoNode) return null;
        return windoNode.win;
    },
    initWinEvent: (id) => {
        const windowNode = App.windowNodePool[id];
        if (!windowNode) return;
        const win = windowNode.win;
        if (CONFIG.isDev) {
            win.webContents.openDevTools()
        }
        win.on('closed', () => {
            delete App.windowNodePool[id];
        })
    },
    open: ({id, option = {}, config = {}, url, file}) => {
        const windowNodePool = App.windowNodePool;
        if (!id) {
            do {
                id = Utils.getUUID(16, 16);
            } while (windowNodePool[id])
        }

        let windowNode = windowNodePool[id];
        if (!windowNode) {
            let _option = JSON.parse(DEFAULT_OPTION)
            Utils.object.merge(_option, option);
            _option[App.ID_KEY] = id;

            const win = new BrowserWindow(_option);
            windowNode = {
                id,
                win,
                option: _option,
                config,
                eventFnPool: {}
            };
            windowNodePool[id] = windowNode;
            App.initWinEvent(id);
            if (windowNode.config.closeToHide) App.closeToHide({id});
            if (windowNode.config.disableContextmenu) App.disableContextmenu({id});
            if (windowNode.config.disableMax) App.disableMax({id});
        }

        if (windowNode.config.show) App.show({id});

        if (Utils.string.isNotBlank(file)) {
            App.loadFile({id, file});
        } else if (Utils.string.isNotBlank(url)) {
            App.loadUrl({id, url});
        }
        return windowNode;
    },
    loadUrl: ({id, url}) => {
        const win = App.getWin({id});
        if (!win) return;
        win.loadURL(url)
    },
    loadFile: ({id, file}) => {
        const win = App.getWin({id});
        if (!win) return;
        win.loadFile(file);
    },
    switch: ({id}) => {
        const win = App.getWin({id});
        if (!win) return;
        if (win.isVisible()) {
            App.hide({id});
        } else {
            App.show({id});
        }
    },
    show: ({id, isCenter = false}) => {
        const win = App.getWin({id});
        if (!win) return;
        win.show();
        win.setSkipTaskbar(false);
        if (isCenter) win.center();
        win.focus()
    },
    showGroup: ({group}) => {
        if (Utils.string.isNotBlank(group)) {
            console.log(group)
        }
        const windowNodePool = App.windowNodePool;
        for (let id in windowNodePool) {
            if (!windowNodePool.hasOwnProperty(id) || !windowNodePool[id] || windowNodePool[id].config.group !== group) continue;
            console.log(group, id, windowNodePool[id].config.group);
            App.show({id})
        }

    },
    hide: ({id}) => {
        const win = App.getWin({id});
        if (!win) return;
        win.hide();
        win.setSkipTaskbar(true)
    },
    switchMax: ({id}) => {
        const win = App.getWin({id});
        if (!win) return;
        if (win.isMaximized()) {
            win.unmaximize()
        } else {
            win.maximize()
        }
    },
    exit: ({id}) => {
        const win = App.getWin({id});
        if (!win) return;
        win.destroy()
        delete App.windowNodePool[id];
    },
    exitAll: () => {
        const windowNodePool = App.windowNodePool;
        App.windowNodePoolForEach((windowNode, id) => {
            windowNode.win.destroy();
            delete windowNodePool[id];
        })
    },
    on: ({id, eventName, fn}) => {
        const windowNode = App.windowNodePool[id];
        if (!windowNode) return;
        if (!windowNode.eventFnPool[eventName]) windowNode.eventFnPool[eventName] = [];
        windowNode.eventFnPool[eventName].push(fn);
        const en = eventName.replace(/^([^.]*).*/, '$1');
        windowNode.win.on(en, fn);
    },
    off: ({id, eventName}) => {
        const windowNode = App.windowNodePool[id];
        if (!windowNode || !windowNode.eventFnPool[eventName]) return;
        const en = eventName.replace(/^([^.]*).*/, '$1');
        windowNode.eventFnPool[eventName].forEach(fn => {
            windowNode.win.off(en, fn);
        });
        delete windowNode.eventFnPool[eventName];
    },
    closeToHide: ({id}) => {
        App.off({id, eventName: 'close.closeToHide'});
        App.on({
            id,
            eventName: 'close.closeToHide',
            fn: (event) => {
                App.hide({id});
                event.preventDefault();
            }
        });
    },
    disableContextmenu: ({id}) => {
        App.off({id, eventName: 'contextmenu.closeToHide'});
        App.on({
            id,
            eventName: "contextmenu.closeToHide",
            fn: (event) => {
                event.preventDefault();
            }
        });
    },
    disableMax: ({id}) => {
        const win = App.getWin({id});
        if (!win) return;
        win.setMaximizable(false);
    },
    windowNodePoolForEach: (fn) => {
        const windowNodePool = App.windowNodePool;
        const ids = Utils.map.keys(windowNodePool);
        ids.forEach((id, i) => {
            fn(windowNodePool[id], id, i)
        })
    },
};

let App = WindowManagementController;

module.exports = WindowManagementController;