# 格律词典网站

此仓库包含格律词典前端代码，采用 React + Vite 构建。

## 目录结构

- `glancy-site/`：React 应用源代码与开发脚本。
- `docs/`：部署与设计相关文档。
- `nginx.conf.example`：Nginx 示例配置。

## 开发环境
所有前端代码位于 `glancy-site/` 目录。安装依赖时需先进入该目录：

```bash
cd glancy-site
npm ci
```

后续的 lint、构建等脚本也在此目录执行。

## 部署方式

通过 GitHub Actions 自动构建并将生成的静态文件同步到云服务器。你需要在仓库的 `Settings -> Secrets and variables -> Actions` 中设置以下几个 Secret：

- `DEPLOY_HOST`：服务器地址
- `DEPLOY_USER`：登录用户名
- `DEPLOY_KEY`：对应用户的私钥
- `WEBSITE_DEPLOY_PATH`：网站文件同步到服务器上的目标目录

每次向 `main` 分支或以 `feature-` 开头的分支推送代码时，`部署到云服务器` 工作流程都会自动执行。

前端构建完成后只需将 `dist` 目录同步到服务器，通过 Nginx 托管即可。示例配置见 `nginx.conf.example`，后端服务独立运行在 `8080` 端口，通过 `/api` 前缀与前端通信。
配置文件中还添加了 `error_page` 指令，用于将 4XX 与 5XX 错误统一重定向到 `/error.html`。部署脚本清理服务器目录时会保留该页面，并在每次部署时上传最新版的 `error.html`。

开发环境下需要在 `vite.config.js` 中开启代理并设置相对路径：

```js
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
})
```

## 开发脚本

所有命令需在 `glancy-site` 目录内执行：

- `npm ci`：安装依赖。
- `npm run dev`：启动本地开发服务器。
- `npm run lint`：执行 ESLint 检查 JavaScript 代码。
- `npm run lint:css`：使用 Stylelint 扫描 `src/**/*.css`。
- `npm test`：运行单元测试。
- `npm run build`：构建生产环境文件。
- `npm run preview`：本地预览构建产物。
- `npm start`：以 Node 服务托管 `dist` 目录。

## 常见问题

### HTTP 503 错误

如果访问站点时返回 `HTTP ERROR 503`，通常是服务器未正确提供静态文件导致。可以按以下步骤排查：

1. 确认 GitHub Actions 构建任务是否执行成功，`dist` 目录是否同步到了服务器。
2. 在服务器上进入项目目录，运行 `npm run build` 后执行 `npm start`，使用内置的 Node 服务临时验证页面是否可以正常访问。
3. 建议使用 Nginx 等 Web 服务器直接托管 `dist` 目录，避免 Node 服务异常导致 503。

## 登录界面

首页已新增用户登录表单，提交信息后会调用后端 `/api/users/login` 接口进行验证。

## 用户注册

注册页采用与登录页一致的布局，可选择邮箱或手机号注册并发送验证码，包含两次密码输入，最终提交到 `/api/users/register` 创建新账号。

## 用户列表与删除

`/users` 页面展示所有用户，数据来自 `GET /api/users`。在列表中点击删除会调用
`DELETE /api/users/{id}`。

## 个人资料编辑

`/profile` 页面通过 `GET /api/profiles/user/{userId}` 载入信息，提交表单时向
`POST /api/profiles/user/{userId}` 保存资料。

## 偏好设置

`/preferences` 先从 `GET /api/preferences` 获取当前配置，保存时发送
`POST /api/preferences`。

## 词汇查询

`/search` 调用 `/api/words?userId=1&term=hello&language=ENGLISH` 获取单词释义，
实际请求需在头部加入 `X-USER-TOKEN`。点击播放按钮访问
`/api/words/audio?word=xxx` 播放语音。

## Search Record Endpoints
- `POST /api/search-records/user/{userId}` – add a new search record for the user
- `GET /api/search-records/user/{userId}` – list search records of the user
- `DELETE /api/search-records/user/{userId}` – clear all search records of the user
- `DELETE /api/search-records/user/{userId}/{recordId}/favorite` – unfavorite a search record
  以上接口均需在 `X-USER-TOKEN` 请求头中提供登录令牌

## 通知中心

`/notifications` 页面通过 `GET /api/notifications` 获取通知列表，标记已读时调
用 `POST /api/notifications/{id}`。

## FAQ 页面

`/faq` 通过 `GET /api/faqs` 拉取常见问题内容。

## 联系表单

`/contact` 页面会把填写的信息提交到 `POST /api/contact`。


## 服务状态

`/health` 页面会定期请求 `/api/ping` 检查服务是否可用。

## 用户总数

首页会调用 `/api/users/count` 显示当前注册人数，并提供刷新按钮重新获取。

## API 使用方式

`ApiProvider` 会在应用初始化时创建统一的请求实例，组件中通过 `useApi` 获取：

```jsx
import { ApiProvider } from './context/ApiContext.jsx'
import { useApi } from './hooks/useApi.js'

function App() {
  const api = useApi()
  // example
  useEffect(() => {
    api.request(API_PATHS.ping)
  }, [api])
}
```

## 消息弹窗组件

当接口请求失败或返回结果异常时，页面会弹出临时消息提示，并可点击关闭。适用场景包括：

1. 聊天消息发送失败。
2. 获取通知列表出错。
3. 登录、注册等表单提交失败。
4. 更新个人资料或偏好设置时出现异常。

组件位于 `src/components/MessagePopup.jsx`，在多处页面复用。
