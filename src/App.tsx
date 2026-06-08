import { useEffect } from 'react';
import { useStore } from './useStore';
import { HomeView } from './components/HomeView';
import { SessionView } from './components/SessionView';

function App() {
  const { appState, theme, zoom, setZoom } = useStore();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoom(prev => Math.min(prev + 0.1, 2.0));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoom(prev => Math.max(prev - 0.1, 0.5));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoom(1.0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setZoom]);

  useEffect(() => {

    document.documentElement.style.zoom = zoom.toString();
  }, [zoom]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      if (systemTheme === 'dark') {
        root.classList.add('dark');
      }
    }


    document.body.style.backgroundColor = 'transparent';
    root.style.backgroundColor = 'transparent';
  }, [theme]);

  return (
    <>
      {appState === 'HOME' ? <HomeView /> : <SessionView />}
    </>
  );
}

export default App;
