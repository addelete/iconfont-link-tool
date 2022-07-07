# 用于iconfont.cn生成外链的小工具

## 预览效果

![screen](https://github.com/addelete/iconfont-link-tool/blob/main/media/screen.png)

## 使用方法：

### 1.安装油猴管理器
管理器有很多种，如果装过可以忽略此步骤。我用的是[tampermonkey](https://www.tampermonkey.net/)

### 2.添加新脚本
在管理器里面添加脚本，复制[greasemonkey.js](https://github.com/addelete/iconfont-link-tool/blob/main/greasemonkey.js)里面的内容粘贴进去，保存。  
搜“上传地址”找到上传地址，可以改成自己的服务地址。  
按下一步操作可以启动一个写好的服务。

### 3.启动上传服务
```shell
# 复制.env，如果换端口可以改PORT，记得同时改油猴脚本里面的上传地址
cp .env.example .env
# 安装依赖
pnpm i
# 构建
pnpm build
# 运行
pnpm start

```

## 计划
- [ ] 上传到阿里云oss