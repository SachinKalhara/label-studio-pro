// src/shared/styles/ThemeStyles.tsx

export const ThemeStyles = () => (
  <style>{`
    /* 🔴 1. අත්‍යවශ්‍ය Global Resets */
    * {
      box-sizing: border-box;
    }

    /* 🔴 2. Light Theme Variables */
    :root, [data-theme="light"] {
      --bg-main: #f8fafc; --bg-panel: #ffffff; --bg-hover: #f1f5f9; --bg-active: #eff6ff; --bg-canvas: #e5e7eb;
      --text-primary: #0f172a; --text-secondary: #64748b; --text-accent: #2563eb;
      --border-color: #e2e8f0; --border-focus: #cbd5e1; --border-active: #bfdbfe;
      --btn-bg: #ffffff; --input-bg: #ffffff;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.05); --shadow-md: 0 4px 6px rgba(0,0,0,0.05); --shadow-modal: 0 25px 50px -12px rgba(0,0,0,0.25);
      --theme-transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;

      /* Excel Table Selection Colors (Light) */
      --col-sel-bg: #bae6fd; 
      --col-sel-text: #0369a1; 
      --row-sel-bg: #dcfce7; 
      --row-sel-border: #16a34a; 
      --cell-sel-bg: #f0f9ff; 
      --cell-sel-text: #166534;
    }

    /* 🔴 3. Dark Theme Variables */
    [data-theme="dark"] {
      --bg-main: #0f172a; --bg-panel: #1e293b; --bg-hover: #334155; --bg-active: #1e3a8a; --bg-canvas: #020617;
      --text-primary: #f8fafc; --text-secondary: #94a3b8; --text-accent: #60a5fa;
      --border-color: #334155; --border-focus: #475569; --border-active: #3b82f6;
      --btn-bg: #1e293b; --input-bg: #0f172a;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.4); --shadow-md: 0 4px 6px rgba(0,0,0,0.4); --shadow-modal: 0 25px 50px -12px rgba(0,0,0,0.7);

      /* Excel Table Selection Colors (Dark) */
      --col-sel-bg: rgba(3, 105, 161, 0.4); 
      --col-sel-text: #7dd3fc; 
      --row-sel-bg: rgba(22, 163, 74, 0.2); 
      --row-sel-border: #22c55e; 
      --cell-sel-bg: rgba(3, 105, 161, 0.1); 
      --cell-sel-text: #86efac;
    }

    body { 
      background-color: var(--bg-main) !important; 
      color: var(--text-primary) !important; 
      transition: var(--theme-transition); 
      margin: 0; 
      padding: 0; 
      font-family: 'Inter', Arial, Helvetica, sans-serif;
    }

    /* 🔴 4. Custom Scrollbars (Desktop UI එකට ගැළපෙන පරිදි) */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: var(--border-focus);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--text-secondary);
    }

    /* 🔴 5. Scrollbar සැඟවීම සඳහා අවශ්‍ය Utility Classes */
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;  /* IE & Edge සඳහා */
      scrollbar-width: none;  /* Firefox සඳහා */
    }
  `}</style>
);