// 获取启动命令里的参数
const isDev = process.argv.indexOf('-run-dev') > -1;
// 设置全局环境变量
process.env.NODE_ENV = isDev ? "development" : "production";

// 导入electron
const Electron = require('electron');
// globalShortcut 模块可以在操作系统中注册/注销全局快捷键, 以便可以为操作定制各种快捷键。
const {app, globalShortcut, BrowserWindow} = Electron;

//
let isReady = false;

// 保持对window对象的全局引用，如果不这么做的话，当JavaScript对象被
// 垃圾回收的时候，window对象将会自动的关闭
let win;

// 添加全局
// 2019年6月27日 10点12分 这个blobal是全局变量，并不是绑定到window节点下面的属性。
const AddGlobal = (key, valFun) => {
    /**
     *  Object.defineProperty() 方法会直接在一个对象上定义一个新属性，或者修改一个对象的现有属性， 并返回这个对象。
     *  资料链接：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
     *  语法: Object.defineProperty(obj, prop, descriptor)
     *  参数：
     *       obj 要在其上定义属性的对象。
     *       prop 要定义或修改的属性的名称。
     *       descriptor 将被定义或修改的属性描述符。
     *  返回值：
     *      被传递给函数的对象。
     *  属性：
     *      configurable 当且仅当该属性的 configurable 为 true 时，该属性描述符才能够被改变，同时该属性也能从对应的对象上被删除。默认为 false。
     *      enumerable 当且仅当该属性的enumerable为true时，该属性才能够出现在对象的枚举属性中。默认为 false。
     */
    /**
     *  toUpperCase() 方法用于把字符串转换为大写。
     *  资料链接: http://www.w3school.com.cn/jsref/jsref_toUpperCase.asp
     *  语法： stringObject.toUpperCase()
     */
    Object.defineProperty(global, `_${key.toUpperCase()}_`, {
        get() {
            return valFun()
        },
        set() {
        },
        enumerable: true,
        configurable: false
    });
};

const __init = () => {
    const WindowManagement = require('./js/WindowManagement');
    let createWindow = () => {
        WindowManagement.start();
    };

    if (isReady) {
        console.log('*-*-*-*-*--*-*-*-*-*-*--isReady');
        createWindow();
    } else {
        // Electron 会在初始化后并准备
        // 创建浏览器窗口时，调用这个函数。
        // 部分 API 在 ready 事件触发后才能使用。
        // app.on('ready', createWindow);
        app.on('ready', createWindow);
    }

    app.on('activate', () => {
        // 在macOS上，当单击dock图标并且没有其他窗口打开时，
        // 通常在应用程序中重新创建一个窗口。
        if (win === null) {
            createWindow()
        }
    });

    // 当全部窗口关闭时退出。
    app.on('window-all-closed', () => {
        // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
        // 否则绝大部分应用及其菜单栏会保持激活。
        if (process.platform !== 'darwin') {
            app.quit()
        }
    });
};

// function createWindow() {
//     // 创建浏览器窗口。
//     win = new BrowserWindow({
//         width: 800,
//         height: 600,
//         webPreferences: {
//             nodeIntegration: true
//         }
//     });
//
//     // 加载index.html文件
//     win.loadFile('electron/index.html')
//
//     // 打开开发者工具
//     win.webContents.openDevTools()
//
//     // 当 window 被关闭，这个事件会被触发。
//     win.on('closed', () => {
//         // 取消引用 window 对象，如果你的应用支持多窗口的话，
//         // 通常会把多个 window 对象存放在一个数组里面，
//         // 与此同时，你应该删除相应的元素。
//         win = null
//     })
// }

// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
// app.on('ready', createWindow);
app.on('ready', () => {
    isReady = true
});


// 在这个文件中，你可以续写应用剩下主进程代码。
// 也可以拆分成几个文件，然后用 require 导入。


// 导入config
const Application = require('./js/Application.js');
// 将各种 config 挂载到global上。然后初始化窗口。
Application.load().then(c => {
    const configStr = JSON.stringify(c);
    // app config 挂载到 global
    AddGlobal('APP_CONFIG', () => JSON.parse(configStr));
    // electron config 挂载到 global
    AddGlobal('ELECTRON_CONFIG', () => JSON.parse(configStr).electron);
    // console.log(global._APP_CONFIG_)
    __init();
}).catch((e) => {
    console.error(e);
    __init();
});