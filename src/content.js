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
          });
        })
      }
    }
    triggerFn();
  }
  // const triggerBtn = () => {
  //   let btn = $('<button id="btn_business">回填参谋数据</button>');
  //   $("body").prepend(btn)
  // }
  // triggerBtn();

  // if (href.includes('login.html')) return;





  return;


})