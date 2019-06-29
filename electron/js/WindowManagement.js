const Utils = require('../libs/utils');
const fs = require('fs');
/**
 * Menu 菜单 https://electronjs.org/docs/api/menu#menusetapplicationmenumenu
 * dialog 显示用于打开和保存文件、警报等的本机系统对话框。
 */
const {BrowserWindow, Menu, dialog} = require('electron');
const Application = require('./Application');
const CONFIG = Application.get();
const CONFIG_WINDOW = CONFIG.electron.WINDOW;
const DEFAULT_OPTION = JSON.stringify(CONFIG_WINDOW.DEFAULT_OPTION);

// window 菜单管理控制器
const WindowManagementController = {
    ID_KEY: '__id__',
    // 窗口资源池
    windowNodePool: {},
    // 初始化窗口
    start: () => {
        /**
         * Menu.setApplicationMenu(menu) 当在MacOS、Windows、Linux中使用menu设置程序菜单时，会设置在各个程序窗体的顶层。
         * 资料： https://electronjs.org/docs/api/menu#menusetapplicationmenumenu
         * 设置菜单
         */
        Menu.setApplicationMenu(null);
        // 起始页窗口配置 -- 获取配置列表
        const startList = CONFIG_WINDOW.START;
        // 配置列表为空 默认使用本地html文件
        if (Utils.list.isEmpty(startList)) {
            App.startEmpty();
            return;
        }
        // windowNodeConfig 配置列表的每条对象
        startList.forEach((windowNodeConfig) => {
            App.open(windowNodeConfig)
        })
    },
    // 本地html文件
    startEmpty: () => {
        App.open({
            id: 'empty',
            file: './electron/index.html'
        })
    },
    // 获取 窗口对象
    getWin: ({id}) => {
        if (Utils.string.isBlank(id)) return null;
        const windowNode = App.windowNodePool[id];
        if (!windowNode) return null;
        return windowNode.win;
    },
    /**
     *  初始化窗口事件
     * @param id 窗口ID
     */
    initWinEvent: (id) => {
        const windowNode = App.windowNodePool[id];
        if (!windowNode) return;
        const win = windowNode.win;
        // 环境判断  dev环境  打开控制台
        if (CONFIG.isDev) {
            // BrowserWindow.webContents.openDevTools () 打开 DevTools。 默认值为 true。
            win.webContents.openDevTools();
        }

        /**
         * 事件： 'closed' 窗口已经关闭时触发。当你接收到这个事件的时候, 你应当删除对已经关闭的窗口的引用对象和避免再次使用它.
         * 资料： https://electronjs.org/docs/api/browser-window#%E4%BA%8B%E4%BB%B6%EF%BC%9A-closed
         */
        win.on('closed', () => {
            delete App.windowNodePool[id];
        });
    },
    /**
     * 创建和控制浏览器窗口。
     * @param id 窗口ID
     * @param option 窗口属性 资料 https://electronjs.org/docs/api/browser-window#winloadfilefilepath-options
     * @param config 窗口事件配置 closeToHide disableContextmenu disableMax show ...
     * @param url 远程URL
     * @param file 本地Html文件
     * @returns {*}
     */
    open: ({id, option = {}, config = {}, url, file}) => {
        const windowNodePool = App.windowNodePool;
        // id 不存在，获取系统 UUID
        if (!id) {
            do {
                // UUID 通用唯一识别码（Universally Unique Identifier）
                id = Utils.getUUID(16, 16);
                console.log('id ==>', id)
            } while (windowNodePool[id])
        }

        // 获取 指定id 窗口资源
        let windowNode = windowNodePool[id];

        if (!windowNode) {
            // default option 默认窗口属性
            let _option = JSON.parse(DEFAULT_OPTION);
            // 合并 默认窗口属性 和 传入窗口属性
            Utils.object.merge(_option, option);
            // __id__ 设为 id
            _option[App.ID_KEY] = id;
            // 创建浏览器窗口。
            const win = new BrowserWindow(_option);
            // 窗口资源 配置
            windowNode = {
                id,
                win,
                option: _option,
                config,
                eventFnPool: {}
            };
            windowNodePool[id] = windowNode;
            // 初始化窗口事件
            App.initWinEvent(id);
            // 绑定 窗口影藏事件
            if (windowNode.config.closeToHide) App.closeToHide({id});
            // 禁用系统托盘
            if (windowNode.config.disableContextmenu) App.disableContextmenu({id});
            // 禁用 窗口最大化
            if (windowNode.config.disableMax) App.disableMax({id});
        }
        // 显示被影藏的窗口
        if (windowNode.config.show) App.show({id});

        // 判断窗口 内容打开的方式
        if (Utils.string.isNotBlank(file)) {
            // 加载本地HTML文件
            App.loadFile({id, file});
        } else if (Utils.string.isNotBlank(url)) {
            // 加载远程URL
            App.loadUrl({id, url});
        }
        return windowNode;
    },
    // 加载远程URL
    loadUrl: ({id, url}) => {
        const win = App.getWin({id});
        if (!win) return;
        // 加载远程URL
        win.loadURL(url)
    },
    // 加载本地HTML文件
    loadFile: ({id, file}) => {
        const win = App.getWin({id});
        if (!win) return;
        // 加载本地HTML文件
        win.loadFile(file);
    },
    // 显示 或 隐藏 窗口
    switch: ({id}) => {
        const win = App.getWin({id});
        if (!win) return;
        // win.isVisible() 返回 Boolean - 判断窗口是否可见
        if (win.isVisible()) {
            App.hide({id});
        } else {
            App.show({id});
        }
    },
    /**
     *  显示被影藏的窗口
     * @param id 窗口id
     * @param isCenter 是否 将窗口移动到屏幕中央
     */
    show: ({id, isCenter = false}) => {
        const win = App.getWin({id});
        if (!win) return;
        // 显示所有被隐藏的应用窗口。需要注意的是，这些窗口不会自动获取焦点。
        win.show();
        //  win.setSkipTaskbar() 使窗口不显示在任务栏中。
        win.setSkipTaskbar(false);
        //  win.center() 将窗口移动到屏幕中央。
        if (isCenter) win.center();
        // 在 Linux 系统中, 使第一个可见窗口获取焦点。在 macOS 上, 让该应用成为活动应用程序。在 Windows 上, 使应用的第一个窗口获取焦点。
        win.focus()
    },
    // 显示 同一分组 所有窗口
    showGroup: ({group}) => {
        if (Utils.string.isBlank(group)) console.log(group);
        const windowNodePool = App.windowNodePool;
        for (let id in windowNodePool) {
            if (!windowNodePool.hasOwnProperty(id) || !windowNodePool[id] || windowNodePool[id].config.group !== group) continue;
            console.log(group, id, windowNodePool[id].config.group);
            App.show({id})
        }
    },
    // 影藏窗口，并影藏任务栏窗口图标
    hide: ({id}) => {
        // 获取 窗口对象
        const win = App.getWin({id});
        if (!win) return;
        // 隐藏窗口
        win.hide();
        // 使窗口不显示在任务栏中。 资料： https://electronjs.org/docs/all#winsetskiptaskbarskip
        win.setSkipTaskbar(true);
    },
    // 最大化 或 最小化 窗口
    switchMax: ({id}) => {
        const win = App.getWin({id});
        if (!win) return;
        // win.isMaximized() 返回 Boolean - 判断窗口是否最大化
        if (win.isMaximized()) {
            // 取消窗口最大化
            win.unmaximize()
        } else {
            // 最大化窗口。如果窗口尚未显示, 这也将会显示 (但不会聚焦)。
            win.maximize()
        }
    },
    // 强制关闭视图
    exit: ({id}) => {
        const win = App.getWin({id});
        if (!win) return;
        //  win.destroy(); 强制关闭视图, 不会为网页发出 unload 和 beforeunload 事件。 完成视图后, 请调用此函数, 以便尽快释放内存和其他资源。
        win.destroy();
        delete App.windowNodePool[id];
    },
    // 强制关闭 所有 视图
    exitAll: () => {
        const windowNodePool = App.windowNodePool;
        App.windowNodePoolForEach((windowNode, id) => {
            windowNode.win.destroy();
            delete windowNodePool[id];
        })
    },
    // 打开所有 窗口控制台
    openAllDevTools: () => {
        App.windowNodePoolForEach((windowNode) => {
            windowNode.win.webContents.openDevTools();
        })
    },
    // 绑定监听事件
    on: ({id, eventName, fn}) => {
        const windowNode = App.windowNodePool[id];
        if (!windowNode) return;
        // 事件资源池 不存在，设置为空数组
        if (!windowNode.eventFnPool[eventName]) windowNode.eventFnPool[eventName] = [];
        // 将 函数 推送到 事件资源池
        windowNode.eventFnPool[eventName].push(fn);
        // 字符串分割 获取 第一个值
        const en = eventName.replace(/^([^.]*).*/, '$1');
        // 监听事件 当执行某个动作时 会触发对应的事件  资料：https://electronjs.org/docs/tutorial/first-app#%E5%BC%80%E5%8F%91%E4%B8%80%E4%B8%AA%E7%AE%80%E6%98%93%E7%9A%84-electron
        windowNode.win.on(en, fn);
    },
    // 移除监听事件
    off: ({id, eventName}) => {
        const windowNode = App.windowNodePool[id];
        // 判断 窗口资源 和 事件资源池 是否存在
        if (!windowNode || !windowNode.eventFnPool[eventName]) return;
        // 字符串分割 获取 第一个值
        const en = eventName.replace(/^([^.]*).*/, '$1');
        //递归遍历 窗口资源 上的 事件资源池
        windowNode.eventFnPool[eventName].forEach(fn => {
            // 将 监听事件 从 窗口上 分离
            windowNode.win.off(en, fn);
        });
        // 事件绑定完成 删除 事件资源池列表
        delete windowNode.eventFnPool[eventName];
    },
    // 影藏窗口
    closeToHide: ({id}) => {
        // 移除监听事件
        App.off({id, eventName: 'close.closeToHide'});
        // 绑定监听事件
        App.on({
            id,
            eventName: 'close.closeToHide',
            fn: (event) => {
                // 影藏窗口，并影藏任务栏窗口图标
                App.hide({id});
                // 调用 event. preventDefault () 将阻止终止应用程序的默认行为。
                event.preventDefault();
            }
        });
    },
    // 禁用系统托盘
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
    // 禁用 窗口最大化
    disableMax: ({id}) => {
        const win = App.getWin({id});
        if (!win) return;
        // 设置窗口是否可以最大化. 在 Linux 上无效.
        win.setMaximizable(false);
    },
    // 窗口资源池 遍历函数
    windowNodePoolForEach: (fn) => {
        const windowNodePool = App.windowNodePool;
        const ids = Utils.map.keys(windowNodePool);
        ids.forEach((id, i) => {
            fn(windowNodePool[id], id, i)
        })
    },
    // 判断 窗口资源池 是否存在
    isEmpty: () => {
        return Utils.map.isEmpty(App.windowNodePool);
    },
    // 将页面打印为 PDF
    toPDF: ({id, fileName = 'export', fileOptions = {}, PDFOptions = {}}) => {
        return new Promise((resolve, reject) => {
            const win = App.getWin({id});
            if (!win) return;
            /**
             * toLocaleLowerCase() 按照本地方式把字符串转换为小写
             * String 的endsWith() 方法用于测 试字符串是否以指定的后缀结束。如果参数表示的字符序列是此对象表示的字符序列的后缀，则返回 true；否则返回 false。注意，如果参数是空字符串，或者等于此 String 对象（用 equals(Object) 方法确定），则结果为 true。
             */
            if (!fileName.toLocaleLowerCase().endsWith('.pdf')) fileName += '.pdf';
            /**
             * 显示保存对话框
             * 资料： https://electronjs.org/docs/all#dialogshowsavedialogbrowserwindow-options-callback
             */
            dialog.showSaveDialog({
                defaultPath: fileName,
                ...fileOptions
            }, (filename) => {
                if (Utils.string.isBlank(filename)) {
                    reject('userCanceled');
                    return;
                }
                // 将 页面资源打印成 PDF
                win.webContents.printToPDF({
                    marginsType: 1,
                    printBackground: true,
                    ...PDFOptions
                }, (error, data) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    fs.writeFile(filename, data, (error) => {
                        if (error) {
                            reject(error);
                            return;
                        }
                        resolve(filename);
                    })
                })
            })
        });
    }
};

let App = WindowManagementController;

module.exports = WindowManagementController;