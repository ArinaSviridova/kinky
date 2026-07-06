export type PartyTheme = {
  background?: string;
  surface?: string;
  surface2?: string;
  text?: string;
  mutedText?: string;
  accent?: string;
  button?: string;
  buttonText?: string;
  border?: string;
  fontFamily?: string;
};

export function applyTheme(theme: PartyTheme = {}) {
  const root = document.documentElement;
  const values: Required<PartyTheme> = {
    background: '#07070a',
    surface: '#12121a',
    surface2: '#191923',
    text: '#f8f5f2',
    mutedText: '#a9a3b4',
    accent: '#f5f2ec',
    button: '#f5f2ec',
    buttonText: '#09090c',
    border: 'rgba(255,255,255,0.12)',
    fontFamily: "'Futura PT', 'Future PT', 'Avenir Next', Montserrat, Arial, sans-serif",
    ...theme,
  };

  root.style.setProperty('--bg', values.background);
  root.style.setProperty('--surface', values.surface);
  root.style.setProperty('--surface-2', values.surface2);
  root.style.setProperty('--text', values.text);
  root.style.setProperty('--muted', values.mutedText);
  root.style.setProperty('--accent', values.accent);
  root.style.setProperty('--button', values.button);
  root.style.setProperty('--button-text', values.buttonText);
  root.style.setProperty('--border', values.border);
  root.style.setProperty('--font', values.fontFamily);
}
