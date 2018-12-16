$(function() {
  const triggerBtn = () => {
    let btn = $('<button id="data_business">回填参谋数据</button>');
    $("body").prepend(btn)
  }
  triggerBtn();

  let href = window.location.href;
  // if (href.includes('login.html')) return;

  const triggerFn = () => {
    let triggerBtn = $("#data_business");
    if (triggerBtn) {
      triggerBtn.on("click", () => {
        chrome.runtime.sendMessage({
          greeting: "business",
        });
      })
    }
  }
  triggerFn();



  return;

  alert(555)

  //监听版本更新信息
  chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
      if (request.greeting == "checkV" && request.res.verSeq > request.res.app_verSeq) {
        $("#smartTip").attr({
          'data-isForced': request.res.isForced
        }).html(`${request.res.description},<a href='${request.res.url}' target="_blank">点击下载</a>`).show();
        $("#reinstall-download-plug").attr({
          "href": request.res.url
        });
      }
    });



  var checkPlugNode = document.createElement('div');
  checkPlugNode.id = 'my-chrome-extension-installed';
  checkPlugNode.style.display = 'none';
  //    checkPlugNode.setAttribute('version', chrome.extension.getManifest().version); // 把版本号放到属性里
  checkPlugNode.innerText = JSON.stringify({
    key: 'value'
  }); // 把通信的data放到标签的html text里面
  document.body.appendChild(checkPlugNode);
  var configData = null;
  var tenMin = function() {
    let tenMin = new Date().getTime() + 1000 * 600;
    return new Date(parseInt(tenMin)).toLocaleString().substr(0, 17);
    // console.log('tenMin',now,Date.parse(new Date()))
  };


  //登录成功后操作
  var sucLoginBtn = document.getElementById('suc-login-tb'),
    smartSetBtn = document.getElementById('smartSet'),
    rollBackDataBtn = document.getElementById('rollBackData');

  sucLoginBtn.addEventListener('eventByLogin', function() {
    $.ajax({
      url: 'https://sycm.taobao.com/custom/menu/getPersonalView.json',
      async: false,
      success: function(res) {
        // let ten = tenMin();
        if (res.code == 0) {
          $(".window-panel").height(260)
          $("#step-login").removeClass("step-current");
          $("#step-data").addClass("step-current");
          $(".window-panel").find(".title").find("h3").html('正在智能回填数据');
          $("#s-step-tip-2").hide();
          $("#s-step-tip-3").show();

          let darenId = $('#smartSet').attr("data-darenid") || 10000,
            darenNameCN = $('#smartSet').attr("data-darenname"),
            darenName = encodeURIComponent(darenNameCN),
            sid = $('#smartSet').attr("data-sid") || 10000,
            tk = $('#smartSet').attr("data-token") || 10000;
          $("#smartTip").html(`您即将要做智能回填的是达人“${darenNameCN}”，请确保当前创作平台登录的是该达人，否则智能回填无法生效。`).show();
          setTimeout(function() {
            $("#smartTip").hide();
            $(".plug-step-win").hide();
          }, 13 * 1000 * 60)
          console.log("开始获取配置数据，请稍候。。。")
          chrome.runtime.sendMessage({
            greeting: "triggerConfig",
            head: "tk=" + tk + "&darenId=" + darenId + "&darenName=" + darenName + "&sid=" + sid
          }, function(response) {
            // console.log('sucLoginBtn',response)
            configData = response;
            $("#rollBackData").trigger("click")
          });
        } else {
          alert('未收到平台确认信息，请重新登录创作平台。');
        }
      }
    })

  })
  //
  smartSetBtn.addEventListener('eventBySmartSet', function() {
    //从淘宝获取用户信息判断是否登录
    $.ajax({
      url: 'https://sycm.taobao.com/custom/menu/getPersonalView.json',
      success: function(res) {
        // let ten = tenMin();
        if (res.code == 0) {
          $(".window-panel").height(260)
          $("#s-step-tip-1").hide();
          $("#s-step-tip-2").hide();
          $("#step-login").removeClass("step-current");
          $("#step-data").addClass("step-current");
          $(".window-panel").find(".title").find("h3").html('正在智能回填数据');
          $("#s-step-tip-3").show();

          let darenId = $('#smartSet').attr("data-darenid") || 10000,
            darenNameCN = $('#smartSet').attr("data-darenname"),
            darenName = encodeURIComponent(darenNameCN),
            sid = $('#smartSet').attr("data-sid") || 10000,
            tk = $('#smartSet').attr("data-token") || 10000;
          $("#smartTip").html(`您即将要做智能回填的是达人“${darenNameCN}”，请确保当前创作平台登录的是该达人，否则智能回填无法生效。`).show();
          setTimeout(function() {
            $("#smartTip").hide();
            $(".plug-step-win").hide();
          }, 13 * 1000 * 60)
          console.log("开始获取配置数据，请稍候。。。")
          chrome.runtime.sendMessage({
            greeting: "triggerConfig",
            head: "tk=" + tk + "&darenId=" + darenId + "&darenName=" + darenName + "&sid=" + sid
          }, function(response) {
            configData = response;
            $("#rollBackData").trigger("click");
          });
        }
      }
    })
  });
  rollBackDataBtn.addEventListener('eventByRollBackData', function() {
    let darenId = $('#smartSet').attr("data-darenid") || 10000,
      darenName = encodeURIComponent($('#smartSet').attr("data-darenname") || 10000),
      sid = $('#smartSet').attr("data-sid") || 10000,
      tk = $('#smartSet').attr("data-token") || 10000;
    let headObj = {
      darenId: darenId,
      tk: tk,
      darenName: darenName,
      sid: sid
    };
    console.log('Begin post data....', configData);

    //爬数据
    chrome.runtime.sendMessage({
      greeting: "spider",
      interFaceList: configData.result,
      head: headObj
    });
  });
})