// const MsgDirectory = require('./MsgExchanger/MsgDirectory.js');

let WinReg;
let RUN_LOCATION = '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';

function getKey() {
    if (!WinReg) {
        WinReg = require('winreg');
    }
    return new WinReg({
        hive: WinReg.HKCU, //CurrentUser,
        key: RUN_LOCATION
    });
}

let Service = {
    win32: {
        enable() {
            return new Promise((resolve, reject) => {
                try {
                    let key = getKey();
                    key.set(global._ELECTRON_CONFIG_.AUTO_START_KEY, WinReg.REG_SZ, process.execPath, () => resolve()
                    );
                } catch (e) {
                    reject(e);
                }
            })
        },
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
        status() {
            return new Promise((resolve, reject) => {
                let key = getKey();
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
 *
 * @param status
 * @returns {Promise}
 */
const AutoStart = (status) => {
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
}

if (global._FIRST_START_) {
    AutoStart(true).catch(() => 0)
}

module.exports = AutoStart;
