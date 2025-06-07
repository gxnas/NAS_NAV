export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/nav-data") {
      const navLinks = env.NAV_LINKS || "";
      const links = navLinks
        .split("\n")
        .map(line => {
          const [name, url] = line.split(",");
          return { name: name?.trim(), url: url?.trim() };
        })
        .filter(item => item.name && item.url);

      return new Response(JSON.stringify(links), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/weather") {
      const ip = request.headers.get("cf-connecting-ip") || "";
      const locRes = await fetch(`https://ipinfo.io/${ip}/json`);
      const locData = await locRes.json();
      const city = locData.city || "Beijing";

      const weatherRes = await fetch(
        `https://zh.wttr.in/${encodeURIComponent(city)}?format=j1&lang=zh`
      );
      const weatherJson = await weatherRes.json();

      return new Response(JSON.stringify({
        city: city,
        current: weatherJson.current_condition[0],
        forecast: weatherJson.weather.slice(0, 3)
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(generateHTML(), {
      headers: { "Content-Type": "text/html; charset=UTF-8" },
    });
  },
};

function generateHTML() {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>GXNAS 导航页</title>
<style>
:root {
  --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --card-bg: rgba(255,255,255,0.95);
  --text-primary: #333;
  --text-secondary: #555;
  --shadow: rgba(0,0,0,0.1);
  --shadow-hover: rgba(0,0,0,0.2);
}
[data-theme="dark"] {
  --bg-gradient: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  --card-bg: rgba(52, 73, 94, 0.95);
  --text-primary: #ecf0f1;
  --text-secondary: #bdc3c7;
  --shadow: rgba(0,0,0,0.3);
  --shadow-hover: rgba(0,0,0,0.5);
}
body {
  margin: 0;
  font-family: 'Segoe UI', sans-serif;
  background: var(--bg-gradient);
  color: var(--text-primary);
  min-height: 100vh;
  display: flex;
  transition: background 0.3s, color 0.3s;
}
.weather-sidebar {
  width: 300px;
  background: rgba(255,255,255,0.2);
  color: #fff;
  padding: 15px;
  box-sizing: border-box;
  backdrop-filter: blur(10px);
  overflow-y: auto;
}
.weather-sidebar h3 {
  margin-top: 0;
}
.main-content {
  flex: 1;
  margin-left: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.header {
  text-align: center;
  color: #fff;
  margin: 20px 0;
}
.header h1 {
  font-weight: 300;
  font-size: 2.5rem;
  margin-bottom: 5px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}
#time-display {
  font-size: 1.2rem;
  opacity: 0.9;
}
#nav-container {
  width: 100%;
  max-width: 1000px;
  padding: 10px 20px 40px 20px;
  box-sizing: border-box;
}
.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}
.nav-card {
  background: var(--card-bg);
  border-radius: 15px;
  padding: 15px 20px;
  box-shadow: 0 4px 12px var(--shadow);
  transition: all 0.3s ease;
  cursor: pointer;
}
.nav-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px var(--shadow-hover);
}
.nav-card h3 {
  margin: 0 0 6px 0;
  font-size: 1.1rem;
  font-weight: 500;
}
.nav-card .url {
  font-size: 0.9rem;
  color: var(--text-secondary);
  word-break: break-all;
}
.loading {
  text-align: center;
  color: #fff;
  font-size: 1.2rem;
  margin-top: 20px;
}
.footer {
  text-align: center;
  color: rgba(255,255,255,0.6);
  margin-top: auto;
  padding: 10px;
}
#theme-toggle-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}
#theme-toggle-btn:hover {
  background: rgba(255,255,255,0.3);
}
</style>
</head>
<body>
  <div class="weather-sidebar">
    <h3>天气状况</h3>
    <pre id="weather-info">加载中...</pre>
  </div>
  <button id="theme-toggle-btn" title="白天/夜间模式切换">🌙</button>
  <div class="main-content">
    <div class="header">
      <h1>GXNAS 导航页</h1>
      <div id="time-display"></div>
    </div>
    <div id="nav-container">
      <div class="loading">正在加载导航链接...</div>
    </div>
    <div class="footer">
      <p>&copy; 2025 GXNAS 版权所有！</p>
    </div>
  </div>
<script>
async function loadNavigation() {
  const res = await fetch('/nav-data');
  const links = await res.json();
  const container = document.getElementById('nav-container');
  if (links.length === 0) {
    container.innerHTML = '<div class="loading">暂无导航链接</div>';
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'nav-grid';
  links.forEach(item => {
    const card = document.createElement('div');
    card.className = 'nav-card';
    card.onclick = () => window.open(item.url, '_blank', 'noopener');
    card.innerHTML = '<h3>' + item.name + '</h3><div class="url">' + item.url + '</div>';
    grid.appendChild(card);
  });
  container.innerHTML = '';
  container.appendChild(grid);
}
async function loadWeather() {
  try {
    const res = await fetch('/weather');
    const data = await res.json();
    const w = data.current;
    let html = '您的位置: ' + data.city + '\\n';
    html += '当前气温: ' + w.temp_C + '°C, ' + w.lang_zh[0].value + '\\n';
    html += '体感温度: ' + w.FeelsLikeC + '°C\\n';
    html += '当前湿度: ' + w.humidity + '%\\n';
    html += '当前风速: ' + w.windspeedKmph + ' km/h\\n';
    html += '\\n未来3天:\\n';
    data.forecast.forEach(day => {
      const hourlyDesc = day.hourly[4].lang_zh[0].value;
      html += day.date + ': ' + day.avgtempC + '°C, ' + hourlyDesc + '\\n';
    });
    
    document.getElementById('weather-info').textContent = html;
  } catch (e) {
    document.getElementById('weather-info').textContent = '无法加载天气信息';
  }
}
function updateTime() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('time-display').textContent =
    y + '年' + m + '月' + d + '日 ' + h + ':' + min + ':' + s;
}
function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  localStorage.setItem('darkMode', dark);
}
document.addEventListener('DOMContentLoaded', () => {
  loadNavigation();
  loadWeather();
  updateTime();
  setInterval(updateTime, 1000);
  const savedDark = localStorage.getItem('darkMode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedDark === 'true' || (savedDark === null && prefersDark);
  applyTheme(isDark);
  document.getElementById('theme-toggle-btn').onclick = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(!isDark);
  };
});
</script>
</body>
</html>
`;
}
