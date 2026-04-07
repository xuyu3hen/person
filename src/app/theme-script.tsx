export function ThemeScript() {
  const code = `(() => {
  try {
    const stored = localStorage.getItem('theme');
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const theme = stored === 'light' || stored === 'dark' ? stored : (prefersLight ? 'light' : 'dark');
    document.documentElement.dataset.theme = theme;
  } catch (e) {}
})();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

