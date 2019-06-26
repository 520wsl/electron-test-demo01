/**
 * 获取 当前系统的硬件信息 获取有关系统，CPU，基板，电池，内存，磁盘/文件系统，网络，泊坞窗，软件，服务和流程的详细信息
 * 资料：https://www.npmjs.com/package/systeminformation
 * 安装 $ npm install systeminformation --save
 */
const si = require('systeminformation');

module.exports = () => {
    return si.uuid().then(data => data.os)
};
