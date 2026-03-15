# SnapTab 官网部署到 Gitee Pages

这套官网静态文件已经整理好，可以直接用于 Gitee Pages。

## 目录

- 首页：`index.html`
- 功能页：`features.html`
- 定价页：`pricing.html`
- 下载页：`download.html`
- 关于页：`about.html`
- 试用页：`trial.html`
- 资源目录：`assets/`

## 推荐做法

1. 新建一个 Gitee 仓库，比如：`snaptab-site`
2. 把 `website/snaptab-official/` 目录下的全部文件上传到仓库根目录
3. 在 Gitee 仓库里打开 `服务` 或 `Pages`
4. 选择要发布的分支，通常是 `master`
5. 点击部署

部署成功后，Gitee 会给你一个 Pages 地址，形如：

`https://你的用户名.gitee.io/snaptab-site/`

## 当前已接好的内容

- 下载按钮已指向当前正式下载链接
- 图标已修正为可直接访问的 `svg`
- 联系方式缺少二维码图片时，会显示文字占位，不会出现破图

## 以后你可能会改的两个地方

### 1. 下载链接

在 `download.html` 中，把下载按钮链接换成你最新发行版的 zip：

`https://gitee.com/你的用户名/你的更新仓库/releases/download/v版本号/你的zip文件名.zip`

### 2. 试用表单

试用表单已支持两种方式：

1. **邮箱接收**：在 `trial.html` 中，把表单的 `data-recipient="your-email@example.com"` 改成你的真实邮箱。提交时会在访客本地打开邮件客户端，自动填充主题和内容，访客点击发送即可发到你邮箱。
2. **微信联系**：若未配置邮箱，页面会提示访客添加微信 **Changtouyaoguai** 发送申请。

后续如需后台自动收集，可接入 Formspree、腾讯问卷、飞书表单等。

## 本地预览

直接双击 `index.html` 就能看基本效果。

如果想更像线上环境，可以在该目录启动静态服务器后再浏览。
