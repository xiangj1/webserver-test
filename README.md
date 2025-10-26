# AstroChart 最简单 Demo

本仓库提供一个**最小可运行**的 [AstroChart](https://github.com/AstroDraw/AstroChart) 使用示例，适合快速了解：

1. 如何加载库（CDN 方式）
2. 如何构造最基本的数据结构（planets + 12 个 cusps）
3. 如何绘制本命盘（Radix）并计算行星相位

## 直接打开

双击或用浏览器打开 `index.html` 即可看到 600x600 的 SVG 星盘。

> 若公司策略或网络限制导致 CDN 加载失败，可切换备用：
> - jsDelivr: `https://cdn.jsdelivr.net/npm/astrochart/dist/astrochart.js`
> - unpkg: `https://unpkg.com/astrochart/dist/astrochart.js`

## 结构说明

`index.html` 中的关键代码：

```html
<script src="https://cdn.jsdelivr.net/npm/astrochart/dist/astrochart.js"></script>
<script>
	const data = { planets: { Sun: [281], Moon: [268] }, cusps: [296,350,30,56,75,94,116,170,210,236,255,274] };
	const chart = new astrochart.Chart('chart', 600, 600);
	const radix = chart.radix(data);
	radix.addPointsOfInterest({ As:[data.cusps[0]], Ic:[data.cusps[3]], Ds:[data.cusps[6]], Mc:[data.cusps[9]] });
	radix.aspects();
</script>
```

## 数据格式快速参考

```js
const data = {
	planets: {
		// 行星名: [度数, 可选速度]
		Sun: [281],
		Moon: [268]
		// ... 其余行星 0–359 之间
	},
	// 12 个宫首（必须正好 12 个值）
	cusps: [296, 350, 30, 56, 75, 94, 116, 170, 210, 236, 255, 274]
};
```

## 可选：本地静态服务

虽然直接双击可运行，但如果想通过本地服务器（方便以后加模块化或调试 CORS），可以：

```bash
npx http-server . -p 8080
# 然后访问 http://localhost:8080
```

## 使用 NPM（可选进阶）

```bash
npm init -y
npm install astrochart
```

在你的打包入口（例如 `main.js`）：

```js
import { Chart } from 'astrochart';
const data = { planets:{ Sun:[281], Moon:[268] }, cusps:[296,350,30,56,75,94,116,170,210,236,255,274] };
new Chart('chart', 600, 600).radix(data).aspects();
```

打包工具（Vite / Webpack）会自动处理依赖。

## 常见问题 (FAQ)

| 问题 | 可能原因 | 解决 |
|------|----------|------|
| 看不到图 | `#chart` 容器不存在 | 确认 HTML 里有 `<div id="chart"></div>` | 
| 控制台报 cusps 数量错误 | cusps 不是 12 个 | 补齐或删减到 12 个 | 
| CDN 加载失败 | 网络限制 | 换 unpkg 或自建本地 dist 文件 | 
| 相位线没有显示 | 未调用 `radix.aspects()` | 补调用或检查行星数量 | 
| astrochart is not defined | 脚本尚未加载或 CDN 失败 | 使用新版 `index.html` 模板(含轮询) 或改用 npm 引入 | 
| loadAstroFallback is not defined | onerror 时函数尚未定义 | 确保 fallback 函数写在外部脚本标签之前（已在当前示例修复） |
| /favicon.ico 404 | 默认请求图标不存在 | 可忽略或放一个小图标到仓库根目录 | 
| 两个 CDN 都失败 | 内网或临时网络阻断 | 下载 `astrochart.js` 到本地或 `npm install astrochart` 并走本地 fallback |

## 下一步可以做什么？

- 添加 transit（行运）并使用 `radix.transit(transitData).aspects()`
- 使用 `transit.animate()` 做动画
- 自定义 `settings`（例如 `SYMBOL_SCALE`, `MARGIN`, `ASPECTS` 配色）

---
如果你还需要一个包含 transit + 动画的最小示例，告诉我即可。🙂

### 进阶：如果两个 CDN 都不可用

1. 临时下载 dist：
	```bash
	wget https://unpkg.com/astrochart/dist/astrochart.js -O astrochart.js
	```
2. 本地引用：
	```html
	<script src="./astrochart.js"></script>
	```
3. 版本锁定：把文件入库或放到你自己的私有静态服务器。

### index.html 当前加载顺序（精简版）

1. 远程：`raw.githubusercontent.com/AstroDraw/AstroChart/main/dist/astrochart.js`
2. 失败 → 本地 `./astrochart.js`

注意：`main` 分支文件会随项目演进而变化，若需要稳定可复现结果，建议改为某个 release tag，例如：

```
https://raw.githubusercontent.com/AstroDraw/AstroChart/v1.5.0/dist/astrochart.js
```

或直接将该版本文件提交到你自己的仓库并引用相对路径。

## 使用 Swiss Ephemeris 自动生成 planets/cusps

本项目新增 `swisseph` 辅助脚本，自动根据日期 + 经纬度 计算行星黄道度数与 12 宫首，然后再交给 AstroChart 绘图。AstroChart 自身不做天文计算，这个步骤是“数据准备层”。

### 1. 安装依赖（已执行可跳过）
```bash
npm install
```

### 2. 生成示例数据
默认脚本参数（可自定义）：
```bash
npm run gen
```
等价于：
```bash
node scripts/generate-data.js \
	--date "1995-08-19T10:25:00+08:00" \
	--lat 30.6 \
	--lon 114.3 \
	--house P \
	--out data.json
```
输出文件：`data.json`，结构如下（截断示例）：
```json
{
	"meta": { "source": "swisseph", "dateInput": "..." },
	"planets": {
		"Sun": [ 146.123456, 0.985647 ],
		"Moon": [ 210.987654, -12.345678 ],
		"NNode": [ 156.432100, -0.052321 ]
	},
	"cusps": [ 123.45, 156.78, ...  ]
}
```

### 3. 在前端使用生成数据
可以把 `index.html` 中的静态 `data` 替换为动态加载：
```html
<script>
fetch('./data.json')
	.then(r => r.json())
	.then(ephem => {
		const data = { planets: ephem.planets, cusps: ephem.cusps };
		const chart = new window.astrochart.Chart('chart', 600, 600);
		chart.radix(data).aspects();
	});
</script>
```

### 4. 速度与逆行
脚本中第二个值是行星黄经速度（若为负表示逆行，可用于 UI 标记）。AstroChart 默认不会自动加“R”逻辑到你的行星集（除非在 transit 中），你可以自行扩展文本显示。

### 5. 宫位系统
当前参数 `--house P` 使用 Placidus，可替换：`K` (Koch), `R` (Regiomontanus) 等（具体取决于 swisseph 支持）。若计算失败脚本会继续输出行星，但宫位可能为空数组。

### 6. 常见计算问题
| 现象 | 可能原因 | 解决 |
|------|----------|------|
| Planet calc failed | 某颗行星计算出错 | 忽略/重试；检查 swisseph 版本 | 
| House calc failed | 经度/纬度格式或 house system 不支持 | 换系统 或 检查参数 | 
| data.json cusps 为空 | 宫位失败 | 重新指定 `--house` | 

### 7. 版权与许可提醒
Swiss Ephemeris 有其许可条款（GPL/专业授权模式）。生产用途请确认合规；演示/学习用途一般问题不大。

---
需要我把 `index.html` 自动改造成动态加载 `data.json` 的版本，或者再加一个独立 `generated.html` 示例吗？告诉我即可。

## 动态表单 + 后端 API（swisseph + AstroChart）调用流程说明

本 Demo 还包含一个“输入出生日期时间 + 经纬度 + 时区 → 自动计算行星与宫位 → 绘制星盘”的完整闭环。核心是前后端分层：

```
┌─────────────┐     fetch(GET)      ┌──────────────────────────────┐
│  浏览器表单  │ ───────────────▶   │ /api/ephemeris (Express + swe) │
│ (index.html) │ ◀──────── JSON ─── │  计算行星+宫位，返回数据        │
└─────┬───────┘                      └───────────┬──────────────────┘
			│ 组装 {planets,cusps}                     │
			▼                                         │swisseph 调用顺序
┌──────────────────────────┐                    │
│ new astrochart.Chart()   │                    │ 1) swe_set_ephe_path()
│   .radix(data).aspects() │                    │ 2) swe_julday()
└──────────────────────────┘                    │ 3) swe_calc_ut() (循环各行星)
							SVG 渲染                           │ 4) swe_houses / swe_houses_ex2()
```

### 前端（`index.html`）关键逻辑
1. 用户填写：`datetime-local`、时区偏移 (tz)、纬度 (lat)、经度 (lon)、宫位系统 (house)。
2. 监听表单 submit：构造 query string 调用 `/api/ephemeris`。
3. 拿到响应 `{ planets, cusps }` 后：
	 ```js
	 const chart = new window.astrochart.Chart('chart', 600, 600);
	 chart.radix({ planets, cusps }).aspects();
	 ```
4. 每次重新生成会清空旧图容器再渲染新 SVG。

### 后端（`server.js`）核心片段概览
```js
// 1) 参数解析 (date, tz, lat, lon, house)
// 2) 本地时间 -> UTC -> 儒略日
const jd = swe.swe_julday(year, month, day, hourDec, swe.SE_GREG_CAL);

// 3) 行星循环 (Sun ... NNode)
swe.swe_calc_ut(jd, planetId, swe.SEFLG_SWIEPH, cb)
// 返回 longitude / speedLong

// 4) 宫位
// 优先扩展: swe_houses_ex2 / swe_houses_ex / fallback swe_houses
// 得到 houses.cusps[1..12]

// 5) 若宫位失败或不足 12 个，使用 fallback 等间距 30° 生成

// 6) 返回 JSON 给前端
res.json({ meta:{...}, planets, cusps })
```

### 字段说明再次汇总
| 字段 | 含义 | 备注 |
|------|------|------|
| planets[Name][0] | 行星黄道度数 (0–360) | 例如 Sun, Moon, Mercury ... NNode |
| planets[Name][1] | 黄经速度 | < 0 代表逆行，可用于显示 “R” |
| cusps | 12 宫首度数 | 失败则 fallback 等间距 |
| meta.jd | 儒略日 | 可用于后续更深计算 |
| meta.cuspsSource | 'houses' 或 'fallback' | 方便前端显示“是否真实宫位”提示 |

### 为什么需要后端？
AstroChart 不内置天文计算。把天文（行星/宫位）与渲染解耦有这些好处：
1. 安全：Ephemeris 逻辑不暴露浏览器细节；可做权限控制/限流。
2. 重复利用：同一套计算接口可服务多个前端（Web / 移动 / 小程序）。
3. 可缓存：热门出生数据或“今天此刻”数据可直接缓存响应。

### 回退策略 (Fallback)
若 `swe_houses*` 系列无法产出 12 个宫首：
1. 仍返回行星数据（不影响基本展示）。
2. 以 0°,30°,60°… 线性填充 12 个 cusps 并标注 `meta.cuspsSource='fallback'`。
3. 前端可在状态栏提示用户“宫位为回退，仅演示”。

### 逆行标记（可自行扩展）
前端拿到 `planets` 后，可二次处理：
```js
Object.entries(planets).forEach(([name, [lon, speed]]) => {
	if (speed < 0) {
		// 可以在图上追加 'R' 标记，或列表展示
	}
});
```

### 性能与扩展建议
| 场景 | 建议 |
|------|------|
| 高频请求同一时间 | 在服务器对 (date,tz,lat,lon,house) 做内存缓存 (Map/LRU) |
| 需要更多点 | 扩展 `PLANETS` 加 Chiron, Lilith, Fortune（需要自行计算或换 ID） |
| 需要真月交点 | 把 `swe.SE_MEAN_NODE` 换成 `swe.SE_TRUE_NODE` |
| 需要批量生成 | 增加 POST 接口，一次发送多个日期地点 |
| 需要 SSR 图片 | 用 headless 浏览器或 svg->png 转换服务 |

### 端到端最简重现步骤
```bash
npm install              # 安装依赖
npm start                # 启动 express + /api/ephemeris
# 浏览器访问端口 (Codespaces 或 localhost:3000)
# 填写表单点击 生成星盘 → 即时生成
```

---
如果还想添加“逆行 R 标记演示”或“transit 动画示例”，随时提需求，我可以继续补充。


