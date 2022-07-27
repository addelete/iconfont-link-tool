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

(function () {
  'use strict';
  const server = 'http://localhost:8888'; // 上传服务地址，改成自己的
  const $ = window.$;
  let maxWaitTime = 10 * 1000;
  let timer = setInterval(function () {
    let node = $('.project-manage-bar').get(0);
    maxWaitTime -= 100;
    if (node || maxWaitTime <= 0) {
      clearInterval(timer);
      $(document).trigger('gogogo');
    }
  }, 100);

  $(document).on('gogogo', function () {
    $.get(`${server}/`, function (data) {
      const uploadBtns = $(`
  <style>
  .upload-btns {
      display: inline-flex;
      align-items: center;
      vertical-align: top;
      color: #fff;
      background: #000;
      border-radius: 40px;
      padding: 0 20px;
      position: relative;
      height: 32px;
      line-height: 32px;
      margin-left: 25px;
      cursor: pointer;
  }
  .upload-btns i {
      margin-right: 5px;
      font-size: 16px;
  }
  .upload-btns__dropdown {
      display: none;
      position: absolute;
      left: 0;
      top: 32px;
      width: 100%;
      background: rgba(0,0,0,0.75);
      border-radius: 6px;
      padding: 10px;
      box-sizing: border-box;
      cursor: default;
  }
  .upload-btns:hover .upload-btns__dropdown {
      display: block;
  }
  .upload-btns__dropdown__item {
      cursor: pointer;
      padding: 0 10px;
      border-radius: 4px;
  }
  
  .upload-btns__dropdown__item:hover {
      background: #EB3223;
  }

  .upload-btns__dropdown__item:active {
    background: red;
}
  
  </style>
  <div class="upload-btns">
    <i>☁️</i>下载并上传至云
    <div class="upload-btns__dropdown">
       ${data.map((item) => `<div class="upload-btns__dropdown__item">${item}</div>`).join('\n')}
    </div>
  </div>
  `);
      $('.project-manage-bar').append(uploadBtns);
      $('.upload-btns__dropdown__item').on('click', function () {
        const target = $(this).text();
        let downloadUrl = '';
        $('.project-manage-bar .btn').each(function () {
          const href = $(this).attr('href');
          if (/download\.zip/.test(href)) {
            downloadUrl = location.protocol + '//' + location.host + href;
          }
        });

        const downloadFile = $.ajax({
          url: downloadUrl,
          type: 'GET',
          xhrFields: {
            responseType: 'blob',
          },
        });
        $.when(downloadFile).then(
          function (content) {
            const blob = new Blob([content]);
            const formData = new FormData();
            formData.append('target', target);
            formData.append('file', blob);
            $.ajax({
              type: 'POST',
              url: `${server}/upload`,
              processData: false,
              contentType: false,
              cache: false,
              data: formData,
              success: function ({ data }) {
                console.log(data); // 接收上传后的返回的iconfont url，可以复制或者别的使用方式
                if (!$('.url-list').get(0)) {
                  $('.project-iconlist').before(
                    '<div class="url-list" style="line-height: 2em; margin-top: 20px;"></div>'
                  );
                }
                $('.url-list').html(
                  `${data.map((item) => `<a href="${item}">${item}</a>`).join('<br>')}`
                );
              },
              error: function (err) {
                console.log('上传失败', err);
              },
            });
          },
          function () {
            console.log('下载失败');
          }
        );
      });
    });
  });
})();
