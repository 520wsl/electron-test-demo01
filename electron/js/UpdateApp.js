const Utils = require('../libs/utils');
const AutoUpdater = require("electron-updater").autoUpdater;
const {dialog, Notification, app, net} = require('electron');
const Path = require('path');
const originalFs = require('original-fs');
const _config_ = global._ELECTRON_CONFIG_;
const APP_LOGO_IMG = _config_.APP_LOGO_IMG;

const GetText = (url, s, f, d) => {
    const request = net.request(url);
    request.on('response', (response) => {
        if (response.statusCode !== 200) {
            f && f(response);
            return;
        }
        let text = "";
        response.on('data', (chunk) => {
            if (d) {
                text += d(chunk);
            } else {
                text += chunk.toString()
            }
        });
        response.on('end', () => {
            s && s(text)
        });
    });
    request.end();
};

const GetFile = (url, writeStream) => {
    const request = net.request(url);
    request.on('response', (response) => {
        if (response.statusCode !== 200) {
            writeStream.destroy(response);
            return;
        }
        response.on('data', (chunk) => {
            writeStream.write(chunk);
        });
        response.on('end', () => {
            writeStream.end();
        });
    });
    request.end();
};

console.log(process.platform + '_' + process.arch);
const downPath = _config_.AUTO_UPDATER_URL + '/' + process.platform + '_' + process.arch;

const UpdateApp = {
    int() {
        AutoUpdater.setFeedURL(downPath);
        AutoUpdater.autoDownload = false;

        AutoUpdater.on('error', function (error) {//更新错误
            Ui.err(error.toString());
        });

        AutoUpdater.on('checking-for-update', function () {//开始检查更新
        });

        AutoUpdater.on('update-available', function (info) {
            if (info.detail) {
                info.detail = info.detail.replace(/\\n/g, '\n')
            }
            Ui.updateable(0, info.version, info.detail, () => {
                AutoUpdater.downloadUpdate();
            })
        });

        AutoUpdater.on('update-not-available', function () {//已最新
            UpdateScript.check();
        });

        AutoUpdater.on('download-progress', function (progressObj) {//下载进度
        });

        AutoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {//下载完成
            Ui.downloaded(() => {
                AutoUpdater.quitAndInstall();
            })
        });
    },
    check() {
        AutoUpdater.checkForUpdates().then(() => {
        });
    }
};

const UpdateScript = {
    download() {
        const tempPath = app.getPath('temp');
        const tempDir = originalFs.mkdtempSync(`${tempPath}/download_`);
        const tempFile = tempDir + '/' + Utils.getUUID(8, 16);
        const writeStream = originalFs.createWriteStream(tempFile);

        writeStream.on('close', () => {
            originalFs.copyFile(tempFile, Path.resolve('./resources/app.asar'), (err) => {
                originalFs.unlink(tempFile, (uErr) => {
                    if (err) {
                        Ui.err(err.toString());
                        return;
                    }

                    Ui.downloaded(() => {
                        if (_config_.isDev) {
                            console.log('更新资源完成');
                            return;
                        }

                        app.relaunch({
                            args: process.argv.slice(1)
                        });// 重启
                        app.exit(0);
                    })
                });
            });
        });
        writeStream.on('error', (err) => {
            Ui.err((err || '').toString());
            originalFs.unlink(tempFile, (uErr) => {
            });
        });
        GetFile(downPath + "/app.asar_?_v=" + (new Date()).getTime(), writeStream);
    },
    check() {
        GetText(_config_.AUTO_UPDATER_URL + '/script-version.json?_v=' + (new Date()).getTime(), (text) => {
            if (Utils.string.isBlank(text)) {
                Ui.err("获取应用资源版本信息失败");
                return;
            }

            const json = JSON.parse(text);
            const lVer = (_config_.SCRIPT_VERSION || '0.0.0').split('.');
            const nVer = (json.version || '0.0.0').split('.');
            for (let i = 0; i < 3; i++) {
                let cnv = parseInt(nVer[i] || 0);
                let cov = parseInt(lVer[i] || 0);
                if (cnv > cov) {
                    Ui.updateable(1, json.version, json.detail, () => {
                        UpdateScript.download()
                    })
                    return;
                } else if (cnv < cov) {
                    break;
                }
            }
            Ui.not();
        }, () => {
            Ui.err("获取应用资源版本信息失败");
        });
    }
};

const Ui = {
    err(msg) {
        new Notification({
            title: '更新失败！',
            body: msg,
            icon: APP_LOGO_IMG
        }).show();
    },
    not() {
        if (_notAvailableDialog) {
            _notAvailableDialog = false;
            dialog.showMessageBox({
                // type: "error",//图标类型
                title: '软件更新',
                message: '已是最新版',
                defaultId: 0,
                buttons: ["知道了"],//下方显示的按钮
                icon: APP_LOGO_IMG //图标
            })
        }
    },
    updateable(mode, version, detail, cb) {
        const type = mode === 0 ? '引擎' : '资源';
        if (_startChecking) {
            new Notification({
                title: `应用${type}有新的版本>${version} 开始自动更新`,
                body: detail || '',
                icon: APP_LOGO_IMG
            }).show();
            cb()
        } else {
            dialog.showMessageBox({
                // type: "error",//图标类型
                title: '软件更新',
                message: `应用${type}有新的版本>${version}` + (detail ? `\n${detail}` : ''),
                defaultId: 0,
                buttons: ["立即更新", "5分钟后提醒"],//下方显示的按钮
                icon: APP_LOGO_IMG,//图标
                cancelId: -1//点击x号关闭返回值
            }, function (index) {
                switch (index) {
                    case 0: {
                        cb();
                        break;
                    }
                    case -1:
                    case 1:
                    default: {
                        laterCheck();
                        break;
                    }
                }
            })
        }
    },
    downloaded(cb) {
        new Notification({
            title: '更新包下载完成，开始安装',
            icon: APP_LOGO_IMG
        }).show();
        cb();
    }
};

const laterCheck = () => {
    clearTimeout(_checkTimeout);
    _checkTimeout = setTimeout(() => {
        UpdateApp.check();
    }, 300000)
};

let _checkTimeout;
let _startChecking = false;
let _notAvailableDialog = false;

UpdateApp.int();

let UpdateAppController = {
    init() {
        _startChecking = true;
        UpdateApp.check()
    },
    check(notAvailableDialog = true) {
        _startChecking = false;
        _notAvailableDialog = notAvailableDialog;
        UpdateApp.check()
    }
};

module.exports = UpdateAppController;