# 用于iconfont.cn生成外链的小工具

## 预览效果

![screen](https://github.com/addelete/iconfont-link-tool/blob/main/media/screen.png)

## 使用方法：

### 1.安装油猴管理器
油猴管理器有很多种，如果装过可以忽略此步骤。我用的是[tampermonkey](https://www.tampermonkey.net/)

### 2.添加新脚本
在管理器里面添加脚本，复制[greasemonkey.js](https://github.com/addelete/iconfont-link-tool/blob/main/greasemonkey.js)里面的内容粘贴进去，保存。  
搜`上传服务地址`找到上传服务地址，可以改成自己的服务地址。  
按下一步操作可以启动一个写好的服务。

### 3.启动上传服务
```shell
# 从.env.example.yaml复制一个.env.yaml，并编辑里面的配置
# 如果换端口可以改port，记得同时改油猴脚本里面的上传服务地址
# 如果想上传至oss，请配置oss相关的变量，并设置相应目标的enable为true
cp .env.example.yaml .env.yaml
# 安装依赖
yarn
# 构建
yarn build
# 运行
yarn start

```

### 4.后台运行
```shell
# 安装pm2，如果装过可以省略
npm install pm2 -g
# 运行
yarn pm2:start
# 停止
yarn pm2:stop
# 重载，如果重新编译或修改.env之后可以运行重载，更新服务
yarn pm2:reload
```

## 特性
- [x] 支持上传并生成外链
- [x] 支持上传到阿里云oss并生成外链
- [x] 支持选择上传目标