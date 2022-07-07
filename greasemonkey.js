// ==UserScript==
// @name         use iconfont.cn
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       addelete
// @match        /^https://www\.iconfont\.cn/manage/index.*manage_type=myprojects.*
// @include      /^https://www\.iconfont\.cn/manage/index.*manage_type=myprojects.*
// @icon         https://img.alicdn.com/imgextra/i4/O1CN01EYTRnJ297D6vehehJ_!!6000000008020-55-tps-64-64.svg
// @require      https://cdn.bootcss.com/jquery/3.3.1/jquery.min.js
// @run-at	     document-end
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  const $ = window.$;
  let maxWaitTime = 10 * 1000
  let timer = setInterval(function(){
    let node = $('.project-manage-bar').get(0)
    maxWaitTime -= 100
    if(node || maxWaitTime <= 0) {
        clearInterval(timer)
         $(document).trigger("gogogo")
    }
  }, 100)

  $(document).on("gogogo", function() {
      const uploadBtn = $(`<a class="bar-text btn btn-normal"><em class="iconfont mr10" style="font-size:16px;margin-right:5px" p-id="709">🎩</em>下载并上传至云</a>`)
      uploadBtn.on('click', function() {
          let downloadUrl = "";
          $('.project-manage-bar .btn').each(function() {
              const href = $(this).attr("href")
              if (/download\.zip/.test(href)) {
                  downloadUrl = location.protocol + "//" + location.host + href
              }
          })

          const downloadFile = $.ajax({
              url: downloadUrl,
              type: 'GET',
              xhrFields: {
                  responseType: 'blob'
              },
          });
          $.when(downloadFile).then(function (content) {
              const blob = new Blob([content])
              const formData = new FormData()
              formData.append('file', blob)
              $.ajax({
                  type: 'POST',
                  url: 'http://localhost:8888/upload', // 上传地址
                  processData: false,
                  contentType: false,
                  cache: false,
                  data: formData,
                  success: function({data}) {
                      console.log(data) // 接收上传后的返回的iconfont url，可以复制或者别的使用方式
                      $('.project-iconlist').before(`
                      <div style="line-height: 2em; margin-top: 20px;">
                      <p>
                      <a href="${data.js}">${data.js}</a>
                      </p>
                      <p>
                      <a href="${data.css}">${data.css}</a>
                      </p>
                      </div>
                      `);
                  },
                  error: function(err) {
                      console.log("上传失败", err)
                  }
              });
          }, function () {
              console.log("下载失败");
          })


      })
      $('.project-manage-bar').append(uploadBtn)
  })
})();