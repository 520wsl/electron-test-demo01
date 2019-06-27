const Path = require('path');
const FILE_ROOT_PATH = Path.join(__dirname, '../');

const APP_LOGO_IMG = '${FILE_ROOT_PATH}public/logo.png';

const APP_CONFIG = {
  CONSTANT: {
    BASE_OSS: 'https://custom-center.oss-cn-hangzhou.aliyuncs.com/customerCenter',
    BASE_DOMAIN: 'chrome.open.sixi.com',
    FILE_ROOT_PATH
  },
  FILE_ROOT_PATH,
  APPLICATION_NET: '${BASE_OSS}/electron/application-net.js',
  APP_INFO: {
    APP_ID: 'clientPcServiceWindow'
  },
  electron: {
    SCRIPT_VERSION: '0.1.5',
    APP_LOGO_IMG,
    APP_LOGO_MIN_IMG: '${FILE_ROOT_PATH}public/sixi.png',
    //自动更新地址
    AUTO_UPDATER_URL: '${BASE_OSS}/electron',
    //开机启动注册键
    AUTO_START_KEY: "SIXI_ELECTRONJS_CLIENT_AUTOSTART",
    FILE_BASE: '${FILE_ROOT_PATH}document/',
    WINDOW: {
      DEFAULT_OPTION: {
        minWidth: 500,
        minHeight: 500,
        width: 1300,
        height: 900,
        icon: APP_LOGO_IMG,
        webPreferences: {
          webSecurity: false,
          allowRunningInsecureContent: true,
          preload: '${FILE_ROOT_PATH}electron/js/preload.js'
        }
      },
      START: [
        {
          id: 'background',
          file: '${FILE_ROOT_PATH}resource/background/index.html',
          option: {
            width: 350,
            height: 500,
            show: false,
            frame: false,
            resizable: false,
            transparent: true,
            backgroundColor: '#00000000'
          },
          config: {
            closeToHide: true,
            disableContextmenu: true,
            disableMax: true,
          }
        },
        {
          id: 'main',
          url: 'http://172.30.34.114:8082/',
          option: {
            minWidth: 380,
            minHeight: 600,
            maxWidth: 380,
            maxHeight: 600,
            width: 380,
            height: 600,
            frame: false,
          },
          config: {
            group: 'main',
            closeToHide: true,
            disableContextmenu: true,
            disableMax: true,
          }
        },
      ],
      PRESET: {
        SETTINGS: {
          id: 'settings',
          file: '${FILE_ROOT_PATH}resource/settings/index.html',
          option: {
            minWidth: 380,
            minHeight: 600,
            width: 500,
            height: 600,
            frame: false,
          },
          config: {
            disableContextmenu: true,
          }
        },
      }
    },
    CHAOS: "WuYnoFp2LjscQy1l5UD9gfK3rI8eawbx",
    CONFUSION: ['QXs4OOgMXhkIJnwg54wEKg==', '3p8ImAMHmwfO7hMGNs6syA=='],
  },
  backgroundView: {
    WEBSOCKET_URL: 'ws://${BASE_DOMAIN}/websocket',
    //websocket断线重连间隔
    WEBSOCKET_RELINK_CD: 180000,
    //websocket断线重连间隔 随机添加的时间范围
    WEBSOCKET_RELINK_CD_WAVE: 120000,
    //任务队列超时时间
    TASK_QUEUE_TIME_OUT: 120000,
    //接到sys.idle(是否有空闲执行任务)指令时任务队列上限
    CMD_TASK_QUEUE_MAX: 2,
    //scout任务默认cd(秒
    TASK_SCOUT_DEFAULT_CD: 30,
    //登录二维码过期时间
    LOGIN_QR_CODE_EXPIRED: 120000,
    //登录二维码状态获取间隔
    LOGIN_QR_CODE_STATUS_CD: 3500,
    SCOUT_URL: '${BASE_OSS}/scout',
    //API
    API_BASE: "https://${BASE_DOMAIN}",
    OAUTH: {
      BASE: 'https://oauth.sixi.com',
      IFRAME: '/sso-login/index.html',
      LOGOUT: '/v2/oauth/logout'
    },
    CHAOS: "poZrONA3i5BHlEateSC0MbhQKWUsGqdL",
    CONFUSION: ['GYfv3xYXFXvDYRVD6ceyog==', '/2VqeV2y5Y75nXTc8EUuTA==', '9EXSD3AAJJq/niLpSVuCfQ=='],
  },

};
module.exports = APP_CONFIG;