// const MsgDirectory = require('./MsgExchanger/MsgDirectory.js');

let WinReg;
// 包含自动启动程序的密钥 资料： https://www.npmjs.com/package/winreg
let RUN_LOCATION = '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';

function getKey() {
    if (!WinReg) {
        // 节点模块，通过注册命令行工具提供对Windows注册表的访问
        WinReg = require('winreg');
    }
    return new WinReg({
        hive: WinReg.HKCU, // 打开注册表配置单元HKEY_CURRENT_USER
        key: RUN_LOCATION // 包含自动启动程序的密钥
    });
}

let Service = {
    win32: {
        // 设置注册表
        enable() {
            return new Promise((resolve, reject) => {
                try {
                    let key = getKey();
                    /**
                     *  process.execPath 属性返回启动 Node.js 进程的可执行文件的绝对路径名。
                     */
                    key.set(global._ELECTRON_CONFIG_.AUTO_START_KEY, WinReg.REG_SZ, process.execPath, () => resolve()
                    );
                } catch (e) {
                    reject(e);
                }
            })
        },
        // 移除注册表
        disable() {
            return new Promise((resolve, reject) => {
                try {
                    let key = getKey();
                    key.remove(global._ELECTRON_CONFIG_.AUTO_START_KEY, () => resolve());
                } catch (e) {
                    reject(e)
                }
            })
        },
        // 注册表状态
        status() {
            return new Promise((resolve, reject) => {
                let key = getKey();
                // 获取注册表信息
                key.get(global._ELECTRON_CONFIG_.AUTO_START_KEY, (error, result) => {
                    if (result) {
                        resolve(!!result.value)
                    } else {
                        if (error && error.toString().indexOf('QUERY command exited') !== -1) {
                            resolve(false)
                        } else {
                            reject(error);
                        }
                    }
                });
            })
        }
    }
};


/**
 *  自动启动
 * @param status
 * @returns {Promise}
 */
const AutoStart = (status) => {
    // process.platform属性返回字符串，标识Node.js进程运行其上的操作系统平台。 资料： http://nodejs.cn/api/process.html#process_process_platform
    // 'aix' 'darwin' 'freebsd' 'linux' 'openbsd' 'sunos' 'win32'
    let service = Service[process.platform];
    if (!service) {
        return Promise.reject('unsupported system')
    }
    if (typeof status === "undefined" || status === null) {
        return service.status();
    } else if (status) {
        return service.enable().then(() => {
            // MsgDirectory.eventSend.mainEvent.autoStartStatus({status: true})
            return null;
        })
    } else {
        return service.disable().then(() => {
            // MsgDirectory.eventSend.mainEvent.autoStartStatus({status: false})
            return null;
        })
    }
};

if (global._FIRST_START_) {
    AutoStart(true).catch(() => 0)
}

module.exports = AutoStart;
