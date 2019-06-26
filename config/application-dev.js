const APP_CONFIG = {
  CONSTANT: {
    BASE_OSS: 'https://custom-center.oss-cn-hangzhou.aliyuncs.com/customerCenter/test',
    BASE_DOMAIN: 'test-chrome.open.sixi.com',
  },
  electron: {
    WINDOW: {
      START: [
        null,
        {
          url: 'http://172.30.34.114:8081/main/home/',
        }
      ]
    }
  },
  backgroundView: {
    //websocket断线重连间隔
    WEBSOCKET_RELINK_CD: 5000,
    //websocket断线重连间隔 随机添加的时间范围
    WEBSOCKET_RELINK_CD_WAVE: 5000,
    //scout任务默认cd(秒
    TASK_SCOUT_DEFAULT_CD: 2,
    OAUTH: {
      BASE: 'https://test-oauth.sixi.com',
    }
  },
};
module.exports = APP_CONFIG;
