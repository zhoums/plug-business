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
const getDataFromSycm = (argumentes) => {
  let tk = util.generatTk(9);
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `https://sycm.taobao.com/xsite/content/single/detail/result.json?dateType=recent30&dateRange=2018-10-10%7C2018-11-08&indexCode=&contentId=207962459196&_=1541740203285&token=${tk}`,
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
const getContentId = (shopId, loginUserId, mainUserId, page = 1, pageSize = 20) => {
  let beginDay = getDateRange(10);
  let endDay = getDateRange(2);
  let contenId = [];
  $.ajax({
    url: `${moli_host}/mer/getContentIdsByShop.wb`,
    async: false,
    headers: {
      version: '1.1.4',
      vs: '1',
      tk: '0000000000000'
    },
    data: {
      page,
      pageSize,
      shopId,
      loginUserId,
      mainUserId
    },
    success(res) {
      console.log('getContentId', res)
      if (!res.hasError) {
        getContentIdPages = Math.ceil(res.content.data.recordCount / pageSize);
        res.content.data.data.forEach((item, key) => {
          contenId = [...contenId, item.contentId]
        })
      }
    }
  })
  return contenId;
}

const postShopData = (param) => {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `${moli_host}/mer/syncPersonalInfo.wb`,
      type: 'post',
      headers: {
        version: '1.1.4',
        vs: '1',
        tk: '0000000000000'
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

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  if (request.greeting == 'business') {
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
      console.log('colectContentIdByPage', res)

      postShopData(res).then((res) => {
        let colectContentIdByPage = []; //收集每个分页的congentid；
        //先跑一页，确定总页数，再根据总页数循环
        let pageOneContentId = getContentId('816',loginUserId,mainUserId);
        colectContentIdByPage = [...colectContentIdByPage, ...pageOneContentId];
        console.log('getContentIdPages', getContentIdPages, colectContentIdByPage)
        let i = 2;
        while (i <= getContentIdPages) {
          let pageI_ContentId = getContentId(i);
          colectContentIdByPage = [...colectContentIdByPage, ...pageI_ContentId];
          console.log(i)
          i++;
          util.sleep(Math.random() * (100 - 20) + 20);
        }
      }).catch(() => {
        alert('同步商家信息出错。')
      })
      $.ajax({
        url: `${moli_host}/mer/syncPersonalInfo.wb`,
        type: 'post',
        headers: {
          version: '1.1.4',
          vs: '1',
          tk: '0000000000000'
        },
        async: false,
        data: res,
        success(response) {
          console.log(response);
        }
      })


      getDataFromSycm().then((data) => {
        let {
          browsePv,
          browseUv,
          contentGuideShopPv,
          contentGuideShopUv,
          contentGuideCartByr,
          contentGuideCartQty,
          contentGuideCltCnt,
          contentGuidePayOrdByr,
          contentGuidePayOrdCnt,
          contentGuidePayOrdAmt
        } = data;
        console.log('get by business:', browsePv, contentGuideShopPv)
      }).catch((reason) => {
        console.log('catch:', reason);
      })
    }).catch((reason) => {
      alert('请先登录生意参谋。')
      console.log('catch:', reason);
    });
  }
  return

  //检查版本更新
  if (request.greeting == "checkVersion") {
    versionObj().then((response) => {
      // console.log(response, response.result.verSeq, app_verSeq, response.result.verSeq > app_verSeq)
      //需要更新插件
      if (response.result.verSeq > app_verSeq) {
        chrome.tabs.getSelected(null, function(tab) {
          chrome.tabs.sendRequest(tab.id, {
            greeting: "checkV",
            res: response.result,
          }, function(response) {
            console.log(response);
          });
        });
        response.result.app_verSeq = app_verSeq;
        sendResponse(response.result);
      }
    })
  }


  //爬数开始 3个if
  //提前获取config内容
  if (request.greeting == "triggerConfig") {
    console.log("正在获取配置数据，请稍候。。。")
    let config;
    $.ajax({
      url: `${moli_host}/spider/config.wb?${request.head}&version=${app_version}&vs=${app_verSeq}`,
      async: false,
      success: function(data) {
        config = data;
      }
    })
    sendResponse(config);
  }

  //返回已经取得的config结果configRes
  if (request.greeting == "fetchConfig") {
    //向前content返回消息
    sendResponse(configRes);
  }
  if (request.greeting == "spider") {
    //向前content返回消息
    request.interFaceList.forEach((item, index) => {
      // console.log(item)
      let argumentList = [];
      let postMoliHeadParam = [];
      //exception begin
      if (!Array.isArray(item.requestArgs)) {
        let param = Object.assign({}, {
          version: app_version,
          msg: 'request.interFaceList item is not a array - > apiUrl: ' + item.apiUrl
        })
        $.ajax({
          url: `${moli_host}/spider/exception.wb`,
          type: 'POST',
          headers: request.head,
          data: param,
          success: function(data) {
            console.log('has error :  +', item.apiUrl)
          }
        })
      } //exception end
      item.requestArgs.forEach(async function(requestArg, index) {
        let _headObj = Object.assign({}, request.head);
        //get请求
        if (item.apiMethod === "get") {
          //添加分页的参数到接口请求参数中
          if (item.pagerArg) {
            requestArg.getArgs['pageParamField'] = {}
            requestArg.getArgs['pageParamField'][item.pagerArg.pageSizeArg] = item.pagerArg.defaultPageSize;
            requestArg.getArgs['pageParamField'][item.pagerArg.pageArg] = 1;
            requestArg.getArgs['pageParamField']['totalField'] = item.pagerArg.totalField;
            requestArg.getArgs['pageParamField']['pageArg'] = item.pagerArg.pageArg;
          }
          argumentList.push(requestArg.getArgs);
          //backArgs:
          if (Array.isArray(requestArg.backArgs)) {
            requestArg.backArgs.forEach((backArg, ind) => {
              _headObj[backArg] = requestArg['getArgs'][backArg];
            })
          } else {
            //exception begin
            //exception end
          }
        } else { //post请求
          //添加分页的参数到接口请求参数中
          if (item.pagerArg) {
            requestArg.postArgs['pageParamField'] = {}
            requestArg.postArgs['pageParamField'][item.pagerArg.pageSizeArg] = item.pagerArg.defaultPageSize;
            requestArg.postArgs['pageParamField'][item.pagerArg.pageArg] = 1;
            requestArg.postArgs['pageParamField']['totalField'] = item.pagerArg.totalField;
            requestArg.postArgs['pageParamField']['pageArg'] = item.pagerArg.pageArg;
          }
          argumentList.push(requestArg.postArgs);
          if (Array.isArray(requestArg.backArgs)) {
            requestArg.backArgs.forEach((backArg, ind) => {
              _headObj[backArg] = requestArg['postArgs'][backArg];
            })
          } else {
            //exception begin
            //exception end
          }
        }
        if (item.contentType) {
          _headObj["Content-Type"] = item.contentType;
        }
        //head参数在这里设置
        postMoliHeadParam.push(_headObj);
      })
      argumentList.forEach((argument, index) => {
        //暂时默认爬数据都是GET，（此处也不应有post?）
        var search = "?";
        let pageObj = null;
        for (var key in argument) {
          if (key == "pageParamField") {
            pageObj = Object.assign({}, argument[key]);
          } else {
            if (search === "?") {
              if (key !== 'syncTime') {
                search += key + "=" + argument[key];
              }
            } else {
              if (key !== 'syncTime') {
                search += "&" + key + "=" + argument[key];
              }
            }
          }
        }

        //爬数
        let ajaxFn = async function(page = 1, isCallBack = false) {
          let time = parseInt(Math.random() * (config.max_interval - config.min_interval) + config.min_interval, 10);
          // util.sleep(time);

          if (pageObj) {
            if (page > 1) {
              pageObj[pageObj.pageArg] = page
            }
            // if (item.apiUrl.includes('single/detail/result.json'))
            //   console.log('000000', pageObj)
            Object.keys(pageObj).forEach((item, id) => {
              if (item !== "totalField" && item !== "pageArg") {
                //防止前面一个参数也没有
                if (search === "?") {
                  search += item + "=" + pageObj[item];
                } else {
                  let jsonList = {};
                  let str = search.slice(search.indexOf("?") + 1);
                  let strs = str.split("&")
                  for (let item of strs) {
                    jsonList[item.split("=")[0]] = item.split("=")[1];
                  }
                  jsonList[item] = pageObj[item]

                  let tempArr = [];
                  for (let i in jsonList) {
                    let key = encodeURIComponent(i);
                    let value = encodeURIComponent(jsonList[i]);
                    tempArr.push(key + '=' + value);
                  }
                  search = "?" + tempArr.join('&');
                }
              }
            })
          }

          util.sleep(time);
          $.ajax({
            url: item.apiUrl + search,
            type: item.apiMethod || 'GET',
            // async: false,
            success: function(data) {
              var success_flag = item.succFlag.split(":")
              //保存出错信息
              if (data[success_flag[0]] == undefined) {
                let param = Object.assign({}, {
                  version: app_version,
                  msg: 'setPlugCookie.js->data[success_flag[0]](line:225)->data:' + JSON.stringify(data) + "   ->success_flag:" + success_flag + "  ->apiUrl:" + item.apiUrl
                })
                $.ajax({
                  url: `${moli_host}/spider/exception.wb`,
                  type: 'POST',
                  headers: request.head,
                  data: param,
                  success: function(data) {
                    console.log('has error :  +', item.apiUrl)
                  }
                })
              } else if (data[success_flag[0]].toString() == $.trim(success_flag[1])) {
                // if (true) { //测试
                var param = {};
                //解析出每一个要传递到后台的参数
                $.each(item.fields, function(_index, field) {
                  if (field.dataRoot) {
                    let level = field.dataRoot.split(".");
                    let _feild = field.fields.split("|");
                    // let _paramLevel = "";
                    let _paramObj = null;
                    //对象
                    if (field.dataType === "entity") {
                      for (let len = 0; len < level.length; len++) {

                        _paramObj = _paramObj ? _paramObj[level[len]] : data[level[len]];
                        // _paramLevel+=`[level[${len}]]`;
                      }
                      // console.log('_paramLevel',_paramLevel,data)
                      $.each(_feild, function(_id, _it) {
                        let _param = _it.split(":");
                        // let s=eval(`data${_paramLevel}`)
                        let s = _paramObj
                        param[_param[1]] = s[_param[0]]
                      })
                    } else if (field.dataType === "list") { //数组
                      param[field['backArg']] = new Array();
                      // let _paramLevel = "";
                      let _paramObj = null;

                      for (let len = 0; len < level.length; len++) {
                        _paramObj = _paramObj ? _paramObj[level[len]] : data[level[len]];
                        // _paramLevel+=`[level[${len}]]`;
                      }
                      // let finalData = eval(`data${_paramLevel}`);
                      let finalData = _paramObj;


                      if (finalData && finalData.length > 0) {
                        finalData.forEach((item, index) => {
                          let objItem = {}
                          $.each(_feild, function(_id, _it) {
                            var _param = _it.split(":");
                            objItem[_param[1]] = item['' + _param[0]]; //字段名有中文
                          })
                          param[field['backArg']].push(objItem);
                        })
                      }
                    } else {
                      param[field['dataField']] = data[field['dataField']]
                    }
                  } else {
                    param[field['dataField']] = data[field['dataField']]
                  }
                })

                //触发回填数据
                let _par = param
                if (postMoliHeadParam[index]['Content-Type']) {
                  _par = JSON.stringify(_par)
                }
                if (Object.keys(_par).length) {
                  // util.sleep(parseInt(Math.random() * (2500 - 100) + 120, 10);)
                  $.ajax({
                    // url: request.url,
                    url: item.serviceUrl,
                    type: 'POST',
                    async: true,
                    tiem: 2300,
                    headers: postMoliHeadParam[index],
                    data: _par,
                    success: function(res) {
                      // console.log(res);
                    }
                  })
                }

                if (pageObj) {
                  let paramArr = pageObj.totalField.split('.');
                  let _paramObj = null;
                  for (let i = 0; i < paramArr.length; i++) {
                    _paramObj = _paramObj ? _paramObj[paramArr[i]] : data[paramArr[i]];
                  }
                  let totalItem = _paramObj;
                  let totalPage = parseInt((parseInt(totalItem) + parseInt(pageObj.pageSize) - 1) / parseInt(pageObj.pageSize));
                  if (!isCallBack) {
                    for (let t = 2; t <= totalPage; t++) {
                      ajaxFn(t, true)
                    }
                  }
                }

              }
            }
          })
        }
        ajaxFn();
        //爬数结束
      })
    })
  }

  //爬数结束

});
