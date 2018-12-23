// 入口

import config from './config'
import util from './util'
import {
  getDateRange
} from './util'
import {
  app_version,
  app_verSeq
} from './config'
import {
  // versionObj,
  moli_host,
  frontEndHost
} from './checkVersion'
//设置refer
chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    if (details.type === 'xmlhttprequest') {
      var exists = false;
      for (var i = 0; i < details.requestHeaders.length; ++i) {
        if (details.requestHeaders[i].name === 'Referer') {
          exists = true;
          details.requestHeaders[i].value = 'https://we.taobao.com/';
          break;
        }
      }

      if (!exists) {
        details.requestHeaders.push({
          name: 'Referer',
          value: 'https://we.taobao.com/'
        });
      }

      return {
        requestHeaders: details.requestHeaders
      };
    }
  }, {
    urls: ['https://*.taobao.com/*']
  }, ["blocking", "requestHeaders"]
);



// let versi = versionObj();

//提前获取config内容
let configRes = null;
let mainUserId, loginUserId;

const checkLogin = () => {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: 'https://sycm.taobao.com/custom/menu/getPersonalView.json?token=' + util.generatTk(9),
      success(res) {
        if (res.code === 0) {
          resolve(res.data)
        } else {
          reject(res.msg)
        }
      },
      faile() {
        reject('获取用户信息失败')
      }
    })
  })
}
//从淘宝取回需要爬的数据
const getDataFromSycm = (contentId, dateFrom, dateTo) => {
  let tk = util.generatTk(9);
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `https://sycm.taobao.com/xsite/content/single/detail/result.json?dateType=range&dateRange=${dateFrom}%7C${dateTo}&indexCode=&contentId=${contentId}&_=1541740203285&token=${tk}`,
      success(res) {
        if (!res.hasError) {
          resolve(res.content.data)
        } else {
          reject(res.content.message)
        }
      },
      faile() {
        reject('系统出错，未知异常')
      }
    })
  })
}
let getContentIdPages = 0; //取ContentId时的总页数
let getContentIdLength = 0; //取ContentId时的总页数
const getContentId = (shopId, loginUserId, mainUserId, token, page = 1, pageSize = 20) => {
  let beginDay = getDateRange(10);
  let endDay = getDateRange(2);
  let contenId = [];
  $.ajax({
    url: `${moli_host}/mer/getContentIdsByShop.wb`,
    async: false,
    headers: {
      version: '1.0.0',
      vs: '1',
      tk: token
    },
    data: {
      page,
      pageSize,
      shopId,
      loginUserId,
      mainUserId
    },
    success(res) {
      if (res.status === 0) {
        if (res.result.contetnIds.length > 0) {
          getContentIdPages++;
        }
        getContentIdLength = res.result.contetnIds.length > 0 ? res.result.contetnIds.length : -1;
        // if (res.result.contetnIds.length == 0) {
        //   console.log('这一面没数据了')
        //   alert('这一面没数据了')
        //   return;
        // }
        res.result.contetnIds.forEach((item, key) => {
          getDataFromSycm(item, res.result.dateFrom, res.result.dateTo).then((data) => {
            postContentData(loginUserId, mainUserId, data, token);
          })
        })
      } else {
        getContentIdLength = -1
      }
    }
  })
  return contenId;
}
const postShopData = (param, token) => {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `${moli_host}/mer/syncPersonalInfo.wb`,
      type: 'post',
      headers: {
        version: '1.0.0',
        vs: '1',
        tk: token
      },
      data: param,
      success(response) {
        if (response.status === 0) {
          resolve()
        } else {
          reject()
        }
        console.log(response);
      }
    })
  })
}
const postContentData = (loginUserId, mainUserId, dataList, token) => {
  let _itemList = [];
  console.log('postContentData - getContentIdPages', getContentIdPages)
  _itemList.push(dataList)
  $.ajax({
    url: `${moli_host}/mer/syncMerEffect.wb`,
    contentType: 'application/json',
    headers: {
      version: '1.0.0',
      vs: '1',
      tk: token,
    },
    // async: false,
    type: 'post',
    data: JSON.stringify({
      loginUserId,
      mainUserId,
      itemList: _itemList
    }),
    success(res) {
      console.log('postContentData', res, getContentIdLength);
    }
  })
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  if (request.greeting == 'business') {

    chrome.tabs.getSelected(null, function(tab) {
      let tabId = tab.id
      // })
      let _tk = request.tk;
      alert('tabId:' + tabId)
      let shopId = request.shopId;
      //检查参谋是否登录，未登录弹出提示，已登录开始爬数据
      checkLogin().then((res) => {
        loginUserId = res.loginUserId;
        mainUserId = res.mainUserId;

        postShopData(res, _tk).then((res) => {
          //触发插件运行提示
          chrome.tabs.sendRequest(tabId, {
            greeting: "showRuning"
          });
          let colectContentIdByPage = []; //收集每个分页的congentid；
          let mainFn = function() {

          }
          mainFn();

          //先跑一页，确定总页数，再根据总页数循环
          let pageOneContentId = getContentId(shopId, loginUserId, mainUserId, _tk);
          colectContentIdByPage = [...colectContentIdByPage, ...pageOneContentId];
          let i = 2;
          console.log('i:', i)
          while (getContentIdLength >= 0) {
            console.log('ll', getContentIdLength)
            console.log('getContentIdLength:', getContentIdLength, i, getContentIdPages)
            if (getContentIdLength == 0) {
              setTimeout(function() {
                console.log('trigger close')
                // chrome.tabs.sendRequest(tabId, {
                //   greeting: "hideRuning"
                // });
              }, 600000000 * 5)
              return;
            }
            let pageI_ContentId = getContentId(shopId, loginUserId, mainUserId, _tk, i);
            colectContentIdByPage = [...colectContentIdByPage, ...pageI_ContentId];
            i++;
            util.sleep(Math.random() * (100 - 20) + 20);
          }
          console.log('getContentIdLength-----:', getContentIdLength)
          if (getContentIdLength == -1) {
            chrome.tabs.sendRequest(tabId, {
              greeting: "hideRuning"
            });
          }

        }).catch(() => {
          alert('同步商家信息出错。')
        })
      }).catch((reason) => {
        sendResponse();
        alert('请先登录生意参谋。')
        console.log('catch:', reason);
      });
    })
  }
  return

});