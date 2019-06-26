let utils = {
  getUUID(len, radix) {
    let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    let uuid = [];
    let i;
    radix = radix || chars.length;
    if (len) {
      for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
    } else {
      let r;
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';
      for (i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | Math.random() * 16;
          uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
        }
      }
    }
    return uuid.join('');
  },
  url: {
    build(url, param) {
      let parStr = "";
      if (param) {
        const type = typeof param;
        if (type === "string") {
          parStr = param;
        } else if (type === "object") {
          parStr = this.mapToParamString(param);
        }
        parStr = (url.indexOf('?') === -1 ? "?" : "&") + parStr;

      }

      return (url + parStr).replace(/(?<!:)\/\/+/g, "/");
    },
    getParam(name) {
      let val = this.getParamMap()[name];
      return utils.object.isNotNull(val) ? val : null;
    },
    getParamKeys() {
      return utils.map.keys(this.getParamMap());
    },
    getParamVals() {
      return utils.map.vals(this.getParamMap());
    },
    getParamMap() {
      return this.paramStringToMap((window.location.search || "").replace(/^\?/, ""));
    },
    paramStringToMap(str) {
      if (utils.string.isBlank(str)) {
        return {};
      }
      let entrys = str.replace(/\+/g, ' ').split('&'), entry, map = {}, k, v;
      for (let i in entrys) {
        if (!entrys.hasOwnProperty(i)) continue;
        entry = entrys[i].split('=');
        k = decodeURIComponent(entry[0]);
        v = entry[1];
        v && (v = decodeURIComponent(v));
        map[k] = v;
      }
      return map;
    },
    mapToParamString(m) {
      if (utils.map.isEmpty(m)) {
        return '';
      }
      let keys = utils.map.keys(m), url = '';
      for (let i = 0, len = keys.length, key, val; i < len; i++) {
        key = keys[i];
        val = m[key];
        if (i !== 0) {
          url += '&';
        }
        url += encodeURIComponent(key);
        if (typeof val !== 'undefined') {
          url += '=' + encodeURIComponent(val);
        }
      }
      return url;
    }
  },
  object: {
    isObject(obj) {
      return this.isNotNull(obj) && obj.constructor === Object;
    },
    isFunction(obj) {
      return typeof obj === 'function';
    },
    isArray(obj) {
      return this.isNotNull(obj) && obj.constructor === Array;
    },
    isNull(obj) {
      return typeof obj === "undefined" || obj === null;
    },
    isNotNull(obj) {
      return !this.isNull(obj);
    },
    getChildrenPath(obj, c, k) {
      if (this.isNull(obj)) {
        return null;
      }
      if (obj === c) {
        return k;
      }
      if (this.isObject(obj)) {
        let v;
        for (let key in obj) {
          if (!obj.hasOwnProperty(key)) continue;
          v = this.getChildrenPath(obj[key], c, key);
          if (utils.string.isNotBlank(v)) {
            return (utils.string.isNotBlank(k) ? k + '.' : '') + v;
          }
        }
      }
      return null;
    },
    merge(t, s, mergeArray = false) {
      for (let k in s) {
        if (!s.hasOwnProperty(k) || typeof s[k] === "undefined" || s[k] === null) continue;
        let item = s[k];
        switch (item.constructor) {
          case Object: {
            if (t[k] && t[k].constructor === Object) {
              this.merge(t[k], item, mergeArray);
            } else {
              t[k] = item;
            }
            break;
          }
          case Array: {
            if (item.length < 1) {
              break;
            }
            if (mergeArray && t[k] && t[k].constructor === Array) {
              for (let i = 0, len = Math.max(t[k].length, item.length); i < len; i++) {
                let mt = t[k][i];
                let it = item[i];
                if (utils.object.isObject(mt) && utils.object.isObject(it)) {
                  this.merge(mt, it, mergeArray);
                } else if (utils.object.isNotNull(it)) {
                  t[k][i] = it;
                }
              }
            } else {
              t[k] = item;
            }
            break;
          }
          case String: {
            if (item.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "").length > 0) {
              t[k] = item;
            }
            break;
          }
          default: {
            t[k] = item;
          }
        }
      }
      return t
    }
  },
  string: {
    /**
     * 转义HTML为&的形式
     * @param str
     * @returns {string}
     */
    escapeHtml(str) {
      if (!str) {
        return '';
      }
      str = str + '';
      str = str.replace(/&/ig, "&amp;");
      str = str.replace(/</ig, "&lt;");
      str = str.replace(/>/ig, "&gt;");
      str = str.replace(/"/ig, "&quot;");
      str = str.replace(/ /ig, "&nbsp;");
      return str;
    },
    trim(str) {
      return utils.object.isNull(str) ? '' : (str + "").replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "")
    },
    isBlank(str) {
      return utils.object.isNull(str) || this.trim(str).length === 0;
    },
    isNotBlank(str) {
      return !this.isBlank(str);
    },
    isEmpty(str) {
      return utils.object.isNull(str) || ("" + str).length === 0;
    },
    isNotEmpty(str) {
      return !this.isEmpty(str)
    },
    equalsIgnoreCase(a, b) {
      if (utils.object.isNull(a) || utils.object.isNull(b)) {
        return false;
      }
      return ('' + a).toLowerCase() === ('' + b).toLowerCase();
    },
    buildTpl(tpl, data) {
      let re = /{%=?((?!%}).|\r|\n)*%}/g,
        code = "let r = [];",
        cursor = 0,
        match;

      function add(str, mode) {
        if (utils.string.isEmpty(str)) {
          return add;
        }

        if (mode === 1) {
          code += `${str}\n`;
        } else if (mode === 2) {
          code += `r.push(${str});\n`
        } else {
          let _s = str.replace(/'/g, "\\'").replace(/\s*([\r\n])\s*/g, ' ');
          if (utils.string.isNotBlank(_s)) {
            code += `r.push('${_s}');\n`
          }
        }
        return add;
      }

      while ((match = re.exec(tpl))) {
        add(tpl.slice(cursor, match.index))(match[0].replace(/(^{%=|^{%|%}$)/g, ""), /^[\t| ]*{%=/g.test(match[0]) ? 2 : 1);
        cursor = match.index + match[0].length;
      }
      add(tpl.substr(cursor));
      code += 'return r.join("");';
      let runFn = function (d) {
        return (new Function(utils.map.keys(d).join(","), code)).apply(null, utils.map.vals(d))
      };
      if (utils.object.isNotNull(data)) {
        return runFn(data);
      } else {
        return runFn;
      }
    }
  },
  list: {
    isEmpty(l) {
      return utils.object.isNull(l) || l.length < 1;
    },
    isNotEmpty(l) {
      return !utils.list.isEmpty(l);
    },
    stringToList(s) {
      return s && s.length > 0 ? (typeof s === 'string' ? s.split(',') : s) : [];
    },
    find(l, k, v, j) {
      let n = [];
      if (utils.list.isNotEmpty(l)) {
        for (let i = 0, len = l.length, r; r = l[i], i < len; i++) {
          if (j ? r[k] === v : '' + r[k] === '' + v) n.push(r);
        }
      }
      return n;
    },
    indexOf(l, k, v, b, j) {
      let n = -1;
      if (utils.list.isNotEmpty(l)) {
        for (let i = b || 0, len = l.length, r; r = l[i], i < len; i++) {
          if (j ? r[k] === v : '' + r[k] === '' + v) {
            n = i;
            break;
          }
        }
      }
      return n;
    }
  },
  map: {
    mapsExtVal(maps, key) {
      let list = [];
      for (let i = 0, len = maps.length; i < len; i++) {
        list.push(maps[i][key]);
      }
      return list;
    },
    listToMap(list, key) {
      if (utils.object.isNull(list) || utils.string.isEmpty(key)) {
        return null;
      }
      let map = {}, row;
      for (let i = 0, len = list.length; i < len; i++) {
        row = list[i];
        map[row[key]] = row;
      }
      return map;
    },
    isEqualForString(a, b) {
      return utils.map.isEqual(a, b, null, true);
    },
    isEmpty(m) {
      return utils.object.isNull(m) || this.keys(m).length < 1;
    },
    isNotEmpty(m) {
      return !this.isEmpty(m);
    },
    isEqual(a, b, isWeak, isString) {
      if (utils.object.isNull(a) && utils.object.isNull(b)) {
        return true;
      }
      if (utils.object.isNull(a) || utils.object.isNull(b)) {
        return false;
      }
      let aks = this.keys(a), bks = this.keys(b)
        , aksl = aks.length, bksl = bks.length;
      if (aksl !== bksl) {
        return false;
      }
      for (let i = 0; i < aksl; i++) {
        if (isWeak || isString ? '' + a[aks[i]] !== '' + b[aks[i]] : a[aks[i]] !== b[aks[i]]) {
          return false;
        }
      }
      return true;

    },
    keys(m) {
      let keys = [];
      for (let key in m) {
        if (m.hasOwnProperty(key)) {
          keys.push(key);
        }
      }
      return keys;
    },
    vals(m) {
      let l = [], keys = utils.map.keys(m);
      for (let i = 0, len = keys.length; i < len; i++) {
        l.push(m[keys[i]])
      }
      return l;
    }
  },
  color: {
    RGBToHex(r, g, b) {
      let rgb = '';
      if (utils.object.isNull(g) || utils.object.isNull(b)) {
        if (!(/^rgba/).test(r.toLowerCase())) {
          r = r.replace(/[^\d,]/g, '').split(',');
          b = r[2];
          g = r[1];
          r = r[0];
          rgb = '#' + toHex(r) + toHex(g) + toHex(b);
        } else {
          rgb = '';
        }
      } else {
        rgb = '#' + toHex(r) + toHex(g) + toHex(b);
      }
      return rgb;

      function toHex(s) {
        return parseInt(s, 10).toString(16).replace(/^(.)$/, '0$1')
      }
    },
    HexToRGB(hex) {
      hex = hex.replace(/[^0-9a-fA-F]/g, '');
      if (hex.length === 3) {
        hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
      }
      let r = parseInt(hex.substring(0, 2), 16),
        g = parseInt(hex.substring(2, 4), 16),
        b = parseInt(hex.substring(4, 6), 16);
      return ['rgb(' + r + ', ' + g + ', ' + b + ')', {r: r, g: g, b: b}];
    }
  },
  json: {
    toString(j) {
      return j ? (typeof j === 'string' ? j : JSON.stringify(j)) : '';
    },
    parse(s) {
      return s ? (typeof s === 'string' ? JSON.parse(s) : s) : null;
    },
    cloneObject(obj) {
      if (utils.object.isNull(obj)) {
        return null;
      }
      return JSON.parse(JSON.stringify(obj));
    }
  },
  cookies: {
    get(name, cipher) {
      let arr, reg = new RegExp("(^| )" + encodeURIComponent(name) + "=([^;]*)(;|$)");
      arr = document.cookie.match(reg);
      if (arr) {
        let val = decodeURIComponent(arr[2]);
        if (cipher) {
          let c = String.fromCharCode(val.charCodeAt(0) - val.length);
          for (let i = 1; i < val.length; i++) {
            c += String.fromCharCode(val.charCodeAt(i) - c.charCodeAt(i - 1));
          }
          val = c
        }
        return val;
      } else
        return null;
    },
    set(name, val, hours, path, cipher) {
      let _expires = '';
      if (typeof hours === 'number') {
        let expires = new Date();
        expires.setTime(expires.getTime() + hours * 3600000);
        _expires = ";expires=" + expires.toUTCString();
      }
      path = utils.string.isNotBlank(path) ? ';path=' + path : '';

      if (cipher) {
        let c = String.fromCharCode(val.charCodeAt(0) + val.length);
        for (let i = 1; i < val.length; i++) {
          c += String.fromCharCode(val.charCodeAt(i) + val.charCodeAt(i - 1));
        }
        val = c;
      }
      document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(val) + _expires + path;
    }
  },
  form: {
    get(f) {
      function filterAttr(ele, attr, val) {
        let e = [], ve = utils.object.isNotNull(val), ist = val === 'text';
        for (let i = 0, len = ele ? ele.length : 0, v; i < len; i++) {
          v = ele[i].getAttribute(attr);
          if (ist && (v === '' || v === null)) v = 'text';
          if (ve ? val === v : utils.object.isNotNull(v)) {
            e.push(ele[i]);
          }
        }
        return e;
      }

      function filterChecked(ele) {
        let e = [];
        for (let i = 0, len = ele.length; i < len; i++) {
          if (ele[i].checked) {
            e.push(ele[i]);
          }
        }
        return e;
      }

      function filter(ele, type) {
        return filterChecked(filterAttr(ele, 'type', type))
      }

      let $input = f.getElementsByTagName('input')
        , $select = f.getElementsByTagName('select')
        , $radios = filter($input, 'radio')
        , $checkboxs = filter($input, 'checkbox')
        , $texts = filterAttr($input, 'type', 'text')
        , params = {}
        , name;

      function getData($ele, allowEmpty) {
        for (let i = 0, len = $ele.length, $e, val; i < len; i++) {
          $e = $ele[i];
          name = $e.getAttribute('name');
          val = $e.value;
          params[name] = !allowEmpty && utils.string.isEmpty(val) ? '' : val;
        }
      }

      getData($select, false);
      getData($radios, false);
      getData($texts, true);
      let names = {};
      for (let j = 0, size = $checkboxs.length; j < size; j++) {
        name = $checkboxs[j].getAttribute('name');
        if (utils.object.isNotNull(name)) {
          names[name] = "";
        }
      }
      names = utils.map.keys(names);
      for (let k = 0, leng = names.length, vals, $checkbox; k < leng; k++) {
        name = names[k];
        $checkbox = filterAttr($checkboxs, 'name', name);
        vals = [];
        for (let n = 0, lengt = $checkbox.length; n < lengt; n++) {
          vals.push($checkbox[n].value)
        }
        params[name] = vals;
      }
      return params;
    }
  },
  date: {
    msToDHMS(m, neg) {
      if (m < 1 && !neg) {
        m = 0;
      }
      let d = {};
      m = parseInt(m, 10);
      d.milliseconds = m % 1000;
      m = parseInt(m / 1000, 10);
      d.seconds = m % 60;
      m = parseInt(m / 60, 10);
      d.minutes = m % 60;
      m = parseInt(m / 60, 10);
      d.hours = m % 24;
      d.day = parseInt(m / 24, 10);
      return d;
    }
  },
  css: {
    classStyle(className, style, val) {
      let cssRules = document.all ? 'rules' : 'cssRules', reg = className.constructor === RegExp, t, d;
      for (let i = 0, len = document.styleSheets.length; i < len; i++) {
        for (let k = 0, size = document.styleSheets[i][cssRules] ? document.styleSheets[i][cssRules].length : 0; k < size; k++) {
          d = document.styleSheets[i]['rules'][k];
          t = d.selectorText;
          if (reg && className.test(t) || t === className) {
            return utils.object.isNull(style) ? d : (utils.object.isNull(val) ? d.style[style] : d.style[style] = val);
          }
        }
      }
      return null;
    },
    addClass(styleEle, selector, rules, index) {
      if (styleEle.constructor !== HTMLStyleElement) {
        let style = document.createElement('style');
        style.type = 'text/css';
        (document.head || document.getElementsByTagName('head')[0]).appendChild(style);
        index = rules;
        rules = selector;
        selector = styleEle;
        styleEle = style;
      }
      let sheet = styleEle.sheet || styleEle.styleSheet;
      index = utils.object.isNull(index) ? (sheet.rules || sheet.cssRules).length : index;
      if (sheet.insertRule) {
        sheet.insertRule(selector + "{" + rules + "}", index);
      } else {
        sheet.addRule(selector, rules, index);
      }
      return styleEle;
    }
  }
};

module.exports = utils;
