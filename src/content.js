$(function() {
  let _href = location.href;
  if (_href.includes('page/datacount/sycm.html')) {

    const triggerFn = () => {
      let triggerBtn = $("#btn_business");

      if (triggerBtn) {
        triggerBtn.on("click", () => {
          let shopId = $("#search_shopId").val();
          let token = $("#token").val();
          if (!shopId) {
            alert('请先选择店铺');
            return;
          }
          chrome.runtime.sendMessage({
            greeting: "business",
            tk: token,
            shopId: shopId
          }, function(res) {
            console.log('lslslsl', res)

          });
        })
      }
    }
    triggerFn();


    //监听事件
    chrome.extension.onRequest.addListener(
      function(request, sender, sendResponse) {
        console.log('request', request)
        if (request.greeting == "showRuning") {
          $("body").append('<div id="crx-cer-progressing" style="position:absolute; background:rgba(120,120,120,.2); right:50px; top:10px;  border:1px solid #f50; padding:5px 15px;">正在回填文章数据，请稍候。。。</div>')
        } else if (request.greeting == 'hideRuning') {
          console.log('djslafdl9999999')
          $("#crx-cer-progressing").html('回填完成dsafsd');
          setTimeout(() => {
            $("#crx-cer-progressing").remove();
          }, 60000)
        }

      });

  }
  // const triggerBtn = () => {
  //   let btn = $('<button id="btn_business">回填参谋数据</button>');
  //   $("body").prepend(btn)
  // }
  // triggerBtn();

  // if (href.includes('login.html')) return;





  return;


})