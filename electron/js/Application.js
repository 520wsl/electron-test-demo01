const Utils = require('../libs/utils');
const OSUUID = require('./OSUUID');

let https = null;
let applicationStr = null;
const isDev = process.env.NODE_ENV === "development";

// 追加配置
const handleConstant = (config, constant) => {
    switch (typeof config) {
        case "string": {
            for (let k in constant) {
                /**
                 * hasOwnProperty() 方法会返回一个布尔值，指示对象自身属性中是否具有指定的属性（也就是是否有指定的键）
                 * 资料： https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty
                 * 语法： obj.hasOwnProperty(prop)
                 */
                if (constant.hasOwnProperty(k)) continue;
                /**
                 * RegExp 对象表示正则表达式，它是对字符串执行模式匹配的强大工具。
                 * 资料： http://www.w3school.com.cn/jsref/jsref_obj_regexp.asp
                 * 创建 RegExp 对象的语法： new RegExp(pattern, attributes);
                 * @type {RegExp}
                 */
                const reg = new RegExp('\\${' + k + '}', 'g');
                /**
                 * replace() 方法用于在字符串中用一些字符替换另一些字符，或替换一个与正则表达式匹配的子串。
                 * 资料： http://www.w3school.com.cn/jsref/jsref_replace.asp
                 * 语法： stringObject.replace(regexp/substr,replacement)
                 * @type {String|*|void|string|never}
                 */
                config = config.replace(reg, constant[k]);
            }
            return config;
        }
        case "object": {
            /**
             * constructor 属性返回对创建此对象的数组函数的引用。
             * 资料： http://www.w3school.com.cn/jsref/jsref_constructor_array.asp
             * 语法： object.constructor
             */
            switch (config.constructor) {
                case Array: {
                    for (let i = 0, len = config.length; i < len; i++) {
                        config[i] = handleConstant(config[i], constant);
                    }
                    return config;
                }
                case Object: {
                    for (let k in config) {
                        if (!config.hasOwnProperty(k)) continue;
                        config[k] = handleConstant(config[k], constant);
                    }
                    return config;
                }
            }
        }

    }
    return config;
};

// 加载文件
const loadFile = (env) => {
    return require('../../config/application' + (env ? '-' + env : ''));
};
// Function 构造新的函数 module.exports;提供了外部访问的接口
const loadNet = (application_net_url) => {
    return new Promise((resolve, reject) => {
        if (!https) https = require('https');
        https.get(application_net_url, (res) => {
            if (res.statusCode !== 200) {
                reject();
                return;
            }
            res.on('data', (d) => {
                let code = d.toString();
                let data = {};
                try {
                    /**
                     * Function 构造函数 创建一个新的Function对象。 在 JavaScript 中, 每个函数实际上都是一个Function对象。
                     * 资料： https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function
                     * 语法：new Function ([arg1[, arg2[, ...argN]],] functionBody)
                     * 参数：
                     *      arg1, arg2, ... argN 被函数使用的参数的名称必须是合法命名的。参数名称是一个有效的JavaScript标识符的字符串，或者一个用逗号分隔的有效字符串的列表;例如“×”，“theValue”，或“A，B”
                     *      functionBody  一个含有包括函数定义的JavaScript语句的字符串。
                     */
                    (new Function('module', code))(data);
                    if (data.exports) {
                        resolve(data.exports);
                    }
                    reject()
                } catch (e) {
                    console.error(e);
                    reject()
                }
            });
        }).on('error', (e) => {
            console.log(e);
            reject();
        });
    });
};

const getApplication = () => {
    return new Promise(async (resolve, reject) => {
        if (applicationStr) {
            resolve(JSON.parse(applicationStr));
            return;
        }
        // 加载默认配置
        let config_default = loadFile();
        let config_dev = {};
        let config_local = {};
        let config_temp = JSON.parse(JSON.stringify(config_default));
        if (isDev) {
            // 加载dev配置
            config_dev = loadFile('dev');
            // 加载local配置
            config_local = loadFile('local');
            // 合并配置
            Utils.object.merge(config_temp, config_dev, true);
            // 合并配置
            Utils.object.merge(config_temp, config_local, true);
        }
        // constant 常量
        if (Utils.map.isNotEmpty(config_temp.CONSTANT)) {
            config_temp = handleConstant(config_temp, config_temp.CONSTANT);
        }
        // application ent 应用程序
        if (config_temp.APPLICATION_ENT) {
            try {
                let config_net = await loadNet(config_temp.APPLICATION_ENT);
                if (Utils.map.isNotEmpty(config_net)) {
                    config_temp = JSON.parse(JSON.stringify(config_default));
                    Utils.object.merge(config_temp, config_net, true);
                    if (isDev) {
                        Utils.object.merge(config_temp, config_dev, true);
                        Utils.object.merge(config_temp, config_local, true);
                    }
                    if (Utils.map.isNotEmpty(config_temp.CONSTANT)) {
                        config_temp = handleConstant(config_temp, config_temp.CONSTANT);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }

        try {
            config_temp.OS_UUID = await OSUUID();
        } catch (e) {
            console.error(e);
        }

        if (isDev) config_temp.isDev = true;
        applicationStr = JSON.stringify(config_temp);
        resolve(JSON.parse(applicationStr))

    })
};

// 获取App Config
const getByWin = () => {
    if (typeof window !== "undefined" && window._electronAgent_ && window._electronAgent_.APP_CONFIG) {
        applicationStr = JSON.stringify(window._electronAgent_.APP_CONFIG);
        return JSON.parse(applicationStr);
    }
    return null;
};

module.exports = {
    load() {
        const application = getByWin();
        if (application) return Promise.resolve(application);
        return getApplication()
    },
    get() {
        const application = getByWin();
        if (application) {
            return application;
        }
        if (Utils.string.isBlank(applicationStr)) return null;
        return JSON.parse(applicationStr)
    }
};