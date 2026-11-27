import {defineTheme} from '@astryxdesign/core/theme';
import {palette} from './nlClassicPalette.generated';

const {blue, green, neutral, orange, red, yellow} = palette;
const withAlpha = (color: string, alpha: string): string => `${color}${alpha}`;

/**
 * Refined Netherlands Civic Theme (`nl-classic`)
 *
 * Crisp geometric sans typography (`Inter` + `Noto Sans Devanagari`) across all
 * headings and UI copy for clean scanability in both Latin and Devanagari scripts,
 * smooth `8px` / `12px` surface geometry, Delft Civic Navy (#154273), and Dutch
 * Terracotta (#C84B16) signal hierarchy.
 */
export const nlClassicTheme = defineTheme({
  name: 'nl-classic',

  typography: {
    scale: {base: 16, ratio: 1.2},
    body: {
      family: 'Inter',
      fallbacks:
        '"Noto Sans Devanagari", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    heading: {
      family: 'Inter',
      fallbacks:
        '"Noto Sans Devanagari", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      weights: {1: 'bold', 2: 'semibold', 3: 'semibold', 4: 'semibold'},
    },
    code: {
      family: 'ui-monospace',
      fallbacks: '"SF Mono", Monaco, Consolas, monospace',
    },
  },

  radius: {base: 6, multiplier: 0.5},
  motion: {fast: 140, medium: 240, slow: 480, ratio: 0.75},

  tokens: {
    '--color-background-body': [neutral.light[95], neutral.dark[5]],
    '--color-background-surface': [neutral.light[100], neutral.dark[10]],
    '--color-background-card': [neutral.light[100], neutral.dark[10]],
    '--color-background-popover': [neutral.light[100], neutral.dark[15]],
    '--color-background-muted': [neutral.light[90], neutral.dark[20]],
    '--color-background-inverted': [blue.light[20], neutral.dark[95]],

    '--color-accent': [blue.light[30], blue.dark[75]],
    '--color-accent-muted': [blue.light[90], withAlpha(blue.dark[75], '33')],
    '--color-on-accent': [neutral.light[100], neutral.dark[5]],
    '--color-neutral': [
      withAlpha(neutral.light[10], '0c'),
      withAlpha(neutral.dark[95], '1a'),
    ],

    '--color-overlay': [
      withAlpha(neutral.light[10], '66'),
      withAlpha(neutral.dark[5], 'cc'),
    ],
    '--color-overlay-hover': [
      withAlpha(blue.light[30], '0c'),
      withAlpha(neutral.dark[95], '0d'),
    ],
    '--color-overlay-pressed': [
      withAlpha(blue.light[30], '18'),
      withAlpha(neutral.dark[95], '1a'),
    ],

    '--color-text-primary': [neutral.light[10], neutral.dark[95]],
    '--color-text-secondary': [neutral.light[35], neutral.dark[75]],
    '--color-text-disabled': [neutral.light[65], neutral.dark[40]],
    '--color-text-accent': [blue.light[30], blue.dark[80]],
    '--color-on-dark': neutral.light[100],
    '--color-on-light': neutral.light[10],

    '--color-icon-accent': [blue.light[30], blue.dark[80]],
    '--color-icon-primary': [neutral.light[10], neutral.dark[95]],
    '--color-icon-secondary': [neutral.light[35], neutral.dark[70]],
    '--color-icon-disabled': [neutral.light[65], neutral.dark[40]],

    '--color-info': [blue.light[30], blue.dark[75]],
    '--color-info-muted': [blue.light[90], blue.dark[20]],
    '--color-on-info': [neutral.light[100], neutral.dark[5]],
    '--color-text-info': [blue.light[25], blue.dark[85]],
    '--color-on-info-muted': [blue.light[20], blue.dark[85]],

    '--color-success': [green.light[35], green.dark[75]],
    '--color-success-muted': [green.light[90], green.dark[20]],
    '--color-on-success': [neutral.light[100], neutral.dark[5]],
    '--color-text-success': [green.light[25], green.dark[85]],
    '--color-on-success-muted': [green.light[25], green.dark[85]],

    '--color-warning': [yellow.light[40], yellow.dark[75]],
    '--color-warning-muted': [yellow.light[90], yellow.dark[20]],
    '--color-on-warning': [neutral.light[100], neutral.dark[5]],
    '--color-text-warning': [yellow.light[25], yellow.dark[85]],
    '--color-on-warning-muted': [yellow.light[25], yellow.dark[85]],

    '--color-error': [red.light[40], red.dark[75]],
    '--color-error-muted': [red.light[90], red.dark[20]],
    '--color-on-error': [neutral.light[100], neutral.dark[5]],
    '--color-text-error': [red.light[25], red.dark[85]],
    '--color-on-error-muted': [red.light[25], red.dark[85]],

    '--color-border': [neutral.light[85], withAlpha(neutral.dark[95], '1a')],
    '--color-border-emphasized': [neutral.light[35], neutral.dark[55]],
    '--border-width': '1px',

    '--color-background-blue': [blue.light[90], blue.dark[25]],
    '--color-border-blue': [blue.light[75], blue.dark[60]],
    '--color-icon-blue': [blue.light[30], blue.dark[80]],
    '--color-text-blue': [blue.light[25], blue.dark[85]],

    '--color-background-orange': [orange.light[90], orange.dark[25]],
    '--color-border-orange': [orange.light[75], orange.dark[60]],
    '--color-icon-orange': [orange.light[45], orange.dark[80]],
    '--color-text-orange': [orange.light[30], orange.dark[85]],

    '--color-background-green': [green.light[90], green.dark[25]],
    '--color-border-green': [green.light[75], green.dark[60]],
    '--color-icon-green': [green.light[35], green.dark[80]],
    '--color-text-green': [green.light[25], green.dark[85]],

    '--color-background-yellow': [yellow.light[90], yellow.dark[25]],
    '--color-border-yellow': [yellow.light[75], yellow.dark[60]],
    '--color-icon-yellow': [yellow.light[40], yellow.dark[80]],
    '--color-text-yellow': [yellow.light[25], yellow.dark[85]],

    '--color-background-red': [red.light[90], red.dark[25]],
    '--color-border-red': [red.light[75], red.dark[60]],
    '--color-icon-red': [red.light[40], red.dark[80]],
    '--color-text-red': [red.light[25], red.dark[85]],

    '--color-background-gray': [neutral.light[90], neutral.dark[20]],
    '--color-border-gray': [neutral.light[85], neutral.dark[30]],
    '--color-icon-gray': [neutral.light[35], neutral.dark[70]],
    '--color-text-gray': [neutral.light[15], neutral.dark[85]],

    '--color-skeleton': [neutral.light[85], neutral.dark[30]],
    '--color-shadow': [
      withAlpha(neutral.light[10], '14'),
      withAlpha(neutral.dark[0], '4d'),
    ],
    '--color-tint-hover': [blue.light[30], neutral.dark[95]],

    '--shadow-low': '0 1px 3px rgba(22, 27, 34, 0.05), 0 1px 2px rgba(22, 27, 34, 0.03)',
    '--shadow-med': '0 4px 12px rgba(22, 27, 34, 0.08), 0 1px 3px rgba(22, 27, 34, 0.04)',
    '--shadow-high': '0 10px 28px rgba(22, 27, 34, 0.12)',
    '--shadow-inset-hover': `inset 0 0 0 1.5px ${withAlpha(blue.light[30], '55')}`,
    '--shadow-inset-selected': `inset 0 0 0 2px ${blue.light[30]}`,
    '--shadow-inset-success': `inset 0 0 0 2px ${green.light[35]}`,
    '--shadow-inset-warning': `inset 0 0 0 2px ${yellow.light[40]}`,
    '--shadow-inset-error': `inset 0 0 0 2px ${red.light[40]}`,
  },

  components: {
    button: {
      base: {
        borderRadius: '8px',
        fontWeight: '600',
        letterSpacing: '0.01em',
      },
      'variant:secondary': {
        backgroundColor: 'var(--color-background-surface)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--color-border-emphasized)',
        color: 'var(--color-text-primary)',
      },
    },
    card: {
      base: {
        borderRadius: '12px',
      },
    },
    badge: {
      base: {
        borderRadius: '6px',
      },
      'variant:success': {
        backgroundColor: 'var(--color-background-green)',
        color: 'var(--color-text-green)',
      },
      'variant:warning': {
        backgroundColor: 'var(--color-background-yellow)',
        color: 'var(--color-text-warning)',
      },
      'variant:error': {
        backgroundColor: 'var(--color-background-red)',
        color: 'var(--color-text-red)',
      },
      'variant:info': {
        backgroundColor: 'var(--color-background-blue)',
        color: 'var(--color-text-blue)',
      },
      'variant:neutral': {
        backgroundColor: 'var(--color-background-gray)',
        color: 'var(--color-text-gray)',
      },
    },
    banner: {
      base: {
        borderRadius: 'var(--radius-container)',
      },
    },
  },
});
