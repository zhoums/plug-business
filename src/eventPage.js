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
let getContentIdPages = 1; //取ContentId时的总页数
let getContentIdLength = 0; //取ContentId时的总页数
const getContentId = (shopId, loginUserId, mainUserId, token, page = 1, pageSize = 50) => {
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
        // getDataFromSycm
        // conso
        getContentIdLength = res.result.contetnIds.length
        res.result.contetnIds.forEach((item, key) => {
          getDataFromSycm(item, res.result.dateFrom, res.result.dateTo).then((data) => {
            postContentData(loginUserId, mainUserId, data, token)
          })
        })
        // contenId = [...contenId, ...res.result.contetnIds];
        // getContentIdLength = res.result.contetnIds.length

        // getContentIdPages = Math.ceil(res.result.data.recordCount / pageSize);
        // res.content.data.data.forEach((item, key) => {
        //   contenId = [...contenId, item.contentId]
        // })
      } else {
        getContentIdLength = 0
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
        version: '1.1.4',
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
  _itemList.push(dataList)
  $.ajax({
    url: `${moli_host}/mer/syncMerEffect.wb`,
    contentType: 'application/json',
    headers: {
      version: '1.0.0',
      vs: '1',
      tk: token,
    },
    type: 'post',
    data: JSON.stringify({
      loginUserId,
      mainUserId,
      itemList: _itemList
    }),
    success(res) {
      console.log(res);
    }
  })
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  if (request.greeting == 'business') {
    let _tk = request.tk;
    let shopId = request.shopId;
    //检查参谋是否登录，未登录弹出提示，已登录开始爬数据
    checkLogin().then((res) => {
      // let colectContentIdByPage = []; //收集每个分页的congentid；
      // //先跑一页，确定总页数，再根据总页数循环
      // let pageOneContentId = getContentId();
      // colectContentIdByPage = [...colectContentIdByPage, ...pageOneContentId];
      // console.log('getContentIdPages', getContentIdPages, colectContentIdByPage)
      // let i = 2;
      // while (i <= getContentIdPages) {
      //   let pageI_ContentId = getContentId(i);
      //   colectContentIdByPage = [...colectContentIdByPage, ...pageI_ContentId];
      //   console.log(i)
      //   i++;
      //   util.sleep(Math.random() * (100 - 20) + 20);
      // }
      loginUserId = res.loginUserId;
      mainUserId = res.mainUserId;

      postShopData(res, _tk).then((res) => {
        let colectContentIdByPage = []; //收集每个分页的congentid；
        //先跑一页，确定总页数，再根据总页数循环
        let pageOneContentId = getContentId(shopId, loginUserId, mainUserId, _tk);
        colectContentIdByPage = [...colectContentIdByPage, ...pageOneContentId];
        let i = 2;
        while (getContentIdLength > 0) {
          let pageI_ContentId = getContentId(shopId, loginUserId, mainUserId, _tk, i);
          colectContentIdByPage = [...colectContentIdByPage, ...pageI_ContentId];
          i++;
          util.sleep(Math.random() * (100 - 20) + 20);
        }
      }).catch(() => {
        alert('同步商家信息出错。')
      })
      // $.ajax({
      //   url: `${moli_host}/mer/syncPersonalInfo.wb`,
      //   type: 'post',
      //   headers: {
      //     version: '1.1.4',
      //     vs: '1',
      //     tk: '0000000000000'
      //   },
      //   async: false,
      //   data: res,
      //   success(response) {
      //     console.log(response);
      //   }
      // })


      // getDataFromSycm().then((data) => {
      //   let {
      //     browsePv,
      //     browseUv,
      //     contentGuideShopPv,
      //     contentGuideShopUv,
      //     contentGuideCartByr,
      //     contentGuideCartQty,
      //     contentGuideCltCnt,
      //     contentGuidePayOrdByr,
      //     contentGuidePayOrdCnt,
      //     contentGuidePayOrdAmt
      //   } = data;
      //   console.log('get by business:', browsePv, contentGuideShopPv)
      // }).catch((reason) => {
      //   console.log('catch:', reason);
      // })
    }).catch((reason) => {
      alert('请先登录生意参谋。')
      console.log('catch:', reason);
    });
  }
  return

});