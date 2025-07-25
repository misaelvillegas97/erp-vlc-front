const chroma = require('chroma-js');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const colors = require('tailwindcss/colors');
const plugin = require('tailwindcss/plugin');
const flattenColorPalette =
  require('tailwindcss/lib/util/flattenColorPalette').default;
const generateContrasts = require(path.resolve(__dirname, '../utils/generate-contrasts'));
const jsonToSassMap = require(path.resolve(__dirname, '../utils/json-to-sass-map'));

// -----------------------------------------------------------------------------------------------------
// @ Utilities
// -----------------------------------------------------------------------------------------------------

/**
 * Normalizes the provided theme by omitting empty values and values that
 * start with "on" from each palette. Also sets the correct DEFAULT value
 * of each palette.
 *
 * @param theme
 */
const normalizeTheme = (theme) => {
  return _.fromPairs(
    _.map(
      _.omitBy(
        theme,
        (palette, paletteName) =>
          paletteName.startsWith('on') || _.isEmpty(palette)
      ),
      (palette, paletteName) => [
        paletteName,
        {
          ...palette,
          DEFAULT: palette['DEFAULT'] || palette[500],
        },
      ]
    )
  );
};

/**
 * Create M3 compatible palette from Tailwind color palette
 * This generates all the required tokens for Material Design 3
 *
 * @param {Object} colorPalette - Tailwind color palette object
 * @returns {Object} M3 compatible palette with all required tokens
 */
const createM3Palette = (colorPalette) => {
    // Extract base colors, ensuring we have all needed shades
    const baseColors = {
        50: colorPalette[50] || '#fafafa',
        100: colorPalette[100] || '#f5f5f5',
        200: colorPalette[200] || '#eeeeee',
        300: colorPalette[300] || '#e0e0e0',
        400: colorPalette[400] || '#bdbdbd',
        500: colorPalette[500] || colorPalette.DEFAULT || '#9e9e9e',
        600: colorPalette[600] || '#757575',
        700: colorPalette[700] || '#616161',
        800: colorPalette[800] || '#424242',
        900: colorPalette[900] || '#212121',
        950: colorPalette[950] || '#0a0a0a',
        DEFAULT: colorPalette.DEFAULT || colorPalette[500] || '#9e9e9e'
    };

    // Create M3 tonal palette mapping Tailwind colors to M3 tones
    const m3Palette = {
        // Core M3 tones mapped from Tailwind shades
        0: '#000000',
        10: baseColors[950],
        20: baseColors[900],
        25: baseColors[800],
        30: baseColors[700],
        35: baseColors[600],
        40: baseColors[600],
        50: baseColors.DEFAULT,
        60: baseColors[400],
        70: baseColors[300],
        80: baseColors[200],
        90: baseColors[100],
        95: baseColors[50],
        98: '#fefefe',
        99: '#ffffff',
        100: '#ffffff',

        // Keep original Tailwind structure for backward compatibility
        ...baseColors,

        // M3 neutral palette (using gray tones)
        neutral: {
            0: '#000000',
            10: '#1e293b',
            20: '#334155',
            25: '#475569',
            30: '#64748b',
            35: '#64748b',
            40: '#64748b',
            50: '#64748b',
            60: '#94a3b8',
            70: '#cbd5e1',
            80: '#e2e8f0',
            90: '#f1f5f9',
            95: '#f8fafc',
            98: '#fdfdfd',
            99: '#ffffff',
            100: '#ffffff',
        },

        // M3 neutral-variant palette (using slate-like tones)
        'neutral-variant': {
            0: '#000000',
            10: '#1e293b',
            20: '#334155',
            25: '#475569',
            30: '#64748b',
            35: '#64748b',
            40: '#64748b',
            50: '#64748b',
            60: '#94a3b8',
            70: '#cbd5e1',
            80: '#e2e8f0',
            90: '#f1f5f9',
            95: '#f8fafc',
            98: '#fdfdfd',
            99: '#ffffff',
            100: '#ffffff',
        },

        // M3 secondary palette (derived from accent/slate)
        secondary: {
            0: '#000000',
            10: '#1e293b',
            20: '#334155',
            25: '#475569',
            30: '#64748b',
            35: '#64748b',
            40: '#64748b',
            50: '#64748b',
            60: '#94a3b8',
            70: '#cbd5e1',
            80: '#e2e8f0',
            90: '#f1f5f9',
            95: '#f8fafc',
            98: '#fdfdfd',
            99: '#ffffff',
            100: '#ffffff',
        },

        // M3 error palette (using red tones)
        error: {
            0: '#000000',
            10: '#7f1d1d',
            20: '#991b1b',
            25: '#b91c1c',
            30: '#dc2626',
            35: '#dc2626',
            40: '#dc2626',
            50: '#ef4444',
            60: '#f87171',
            70: '#fca5a5',
            80: '#fecaca',
            90: '#fee2e2',
            95: '#fef2f2',
            98: '#fffefe',
            99: '#ffffff',
            100: '#ffffff',
        }
    };

    return m3Palette;
};

/**
 * Generate M3 compatible contrast colors for a given palette
 *
 * @param {Object} palette - M3 palette object
 * @returns {Object} Contrast colors object
 */
const generateM3Contrasts = (palette) => {
    const contrasts = {};

    // Generate contrasts for each tone
    Object.keys(palette).forEach(tone => {
        if (typeof palette[tone] === 'string' && palette[tone].startsWith('#')) {
            const color = chroma(palette[tone]);
            const luminance = color.luminance();

            // Use white text for dark colors, black text for light colors
            contrasts[tone] = luminance > 0.5 ? '#000000' : '#ffffff';
        }
    });

    // Specific contrast overrides for common tones
    contrasts.DEFAULT = contrasts['50'] || contrasts[500] || '#ffffff';
    contrasts[200] = '#000000';
    contrasts[300] = '#000000';
    contrasts[400] = '#000000';
    contrasts[500] = '#ffffff';
    contrasts[600] = '#ffffff';
    contrasts[700] = '#ffffff';
    contrasts[800] = '#ffffff';
    contrasts[900] = '#ffffff';
    contrasts[950] = '#ffffff';

    return contrasts;
};

// -----------------------------------------------------------------------------------------------------
// @ FUSE TailwindCSS Main Plugin
// -----------------------------------------------------------------------------------------------------
const theming = plugin.withOptions(
  (options) =>
    ({addComponents, e, theme}) => {
      /**
       * Create user themes object by going through the provided themes and
       * merging them with the provided "default" so, we can have a complete
       * set of color palettes for each user theme.
       */
      const userThemes = _.fromPairs(
        _.map(options.themes, (theme, themeName) => [
          themeName,
          _.defaults({}, theme, options.themes['default']),
        ])
      );

      /**
       * Normalize the themes and assign it to the themes object. This will
       * be the final object that we create a SASS map from
       */
      let themes = _.fromPairs(
        _.map(userThemes, (theme, themeName) => [
          themeName,
          normalizeTheme(theme),
        ])
      );

      /**
       * Go through the themes to generate M3 compatible palettes and contrasts,
       * filtering to only have "primary", "accent" and "warn" objects.
       */
      themes = _.fromPairs(
        _.map(themes, (theme, themeName) => [
          themeName,
          _.pick(
            _.fromPairs(
              _.map(theme, (palette, paletteName) => {
                  // Create M3 compatible palette
                  const m3Palette = createM3Palette(palette);

                  // Generate contrasts using the M3 palette
                  const contrasts = generateM3Contrasts(m3Palette);

                  return [
                      paletteName,
                      {
                          ...m3Palette,
                          contrast: _.fromPairs(
                            _.map(
                              contrasts,
                              (color, hue) => [
                                  hue,
                                  _.get(userThemes[themeName], [
                                      `on-${paletteName}`,
                                      hue,
                                  ]) || color,
                              ]
                            )
                          ),
                      },
                  ];
              })
            ),
            ['primary', 'accent', 'warn']
          ),
        ])
      );

      /**
       * Go through the themes and attach appropriate class selectors so,
       * we can use them to encapsulate each theme.
       */
      themes = _.fromPairs(
        _.map(themes, (theme, themeName) => [
          themeName,
          {
            selector: `".theme-${themeName}"`,
            ...theme,
          },
        ])
      );

      /* Generate the SASS map using the themes object */
      const sassMap = jsonToSassMap(
        JSON.stringify({'user-themes': themes})
      );

      /* Get the file path */
      const filename = path.resolve(
        __dirname,
        '../../styles/user-themes.scss'
      );

      /* Read the file and get its data */
      let data;
      try {
        data = fs.readFileSync(filename, {encoding: 'utf8'});
      } catch (err) {
        console.error(err);
      }

      /* Write the file if the map has been changed */
      if (data !== sassMap) {
        try {
          fs.writeFileSync(filename, sassMap, {encoding: 'utf8'});
        } catch (err) {
          console.error(err);
        }
      }

      /**
       * Iterate through the user's themes and build Tailwind components containing
       * CSS Custom Properties using the colors from them. This allows switching
       * themes by simply replacing a class name as well as nesting them.
       */
      addComponents(
        _.fromPairs(
          _.map(options.themes, (theme, themeName) => [
            themeName === 'default'
              ? 'body, .theme-default'
              : `.theme-${e(themeName)}`,
            _.fromPairs(
              _.flatten(
                _.map(
                  flattenColorPalette(
                    _.fromPairs(
                      _.flatten(
                        _.map(
                          normalizeTheme(theme),
                          (palette, paletteName) => [
                            [
                              e(paletteName),
                              palette,
                            ],
                            [
                              `on-${e(paletteName)}`,
                              _.fromPairs(
                                _.map(
                                  generateContrasts(
                                    palette
                                  ),
                                  (
                                    color,
                                    hue
                                  ) => [
                                    hue,
                                    _.get(
                                      theme,
                                      [
                                        `on-${paletteName}`,
                                        hue,
                                      ]
                                    ) ||
                                    color,
                                  ]
                                )
                              ),
                            ],
                          ]
                        )
                      )
                    )
                  ),
                  (value, key) => [
                    [`--fuse-${e(key)}`, value],
                    [
                      `--fuse-${e(key)}-rgb`,
                      chroma(value).rgb().join(','),
                    ],
                  ]
                )
              )
            ),
          ])
        )
      );

      /**
       * Generate scheme based css custom properties and utility classes
       */
      const schemeCustomProps = _.map(
        ['light', 'dark'],
        (colorScheme) => {
          const isDark = colorScheme === 'dark';
          const background = theme(
            `fuse.customProps.background.${colorScheme}`
          );
          const foreground = theme(
            `fuse.customProps.foreground.${colorScheme}`
          );
          const lightSchemeSelectors =
            'body.light, .light, .dark .light';
          const darkSchemeSelectors =
            'body.dark, .dark, .light .dark';

          return {
            [isDark ? darkSchemeSelectors : lightSchemeSelectors]: {
              /**
               * If a custom property is not available, browsers will use
               * the fallback value. In this case, we want to use '--is-dark'
               * as the indicator of a dark theme so, we can use it like this:
               * background-color: var(--is-dark, red);
               *
               * If we set '--is-dark' as "true" on dark themes, the above rule
               * won't work because of the said "fallback value" logic. Therefore,
               * we set the '--is-dark' to "false" on light themes and not set it
               * at all on dark themes so that the fallback value can be used on
               * dark themes.
               *
               * On light themes, since '--is-dark' exists, the above rule will be
               * interpolated as:
               * "background-color: false"
               *
               * On dark themes, since '--is-dark' doesn't exist, the fallback value
               * will be used ('red' in this case) and the rule will be interpolated as:
               * "background-color: red"
               *
               * It's easier to understand and remember like this.
               */
              ...(!isDark ? {'--is-dark': 'false'} : {}),

              /* Generate custom properties from customProps */
              ..._.fromPairs(
                _.flatten(
                  _.map(background, (value, key) => [
                    [`--fuse-${e(key)}`, value],
                    [
                      `--fuse-${e(key)}-rgb`,
                      chroma(value).rgb().join(','),
                    ],
                  ])
                )
              ),
              ..._.fromPairs(
                _.flatten(
                  _.map(foreground, (value, key) => [
                    [`--fuse-${e(key)}`, value],
                    [
                      `--fuse-${e(key)}-rgb`,
                      chroma(value).rgb().join(','),
                    ],
                  ])
                )
              ),
            },
          };
        }
      );

      const schemeUtilities = (() => {
        /* Generate general styles & utilities */
        return {};
      })();

      addComponents(schemeCustomProps);
      addComponents(schemeUtilities);
    },
  (options) => {
    return {
      theme: {
        extend: {
          /**
           * Add 'Primary', 'Accent' and 'Warn' palettes as colors so all color utilities
           * are generated for them; "bg-primary", "text-on-primary", "bg-accent-600" etc.
           * This will also allow using arbitrary values with them such as opacity and such.
           */
          colors: _.fromPairs(
            _.flatten(
              _.map(
                _.keys(
                  flattenColorPalette(
                    normalizeTheme(options.themes.default)
                  )
                ),
                (name) => [
                  [
                    name,
                    `rgba(var(--fuse-${name}-rgb), <alpha-value>)`,
                  ],
                  [
                    `on-${name}`,
                    `rgba(var(--fuse-on-${name}-rgb), <alpha-value>)`,
                  ],
                ]
              )
            )
          ),
        },
        fuse: {
          customProps: {
            background: {
              light: {
                'bg-app-bar': '#FFFFFF',
                'bg-card': '#FFFFFF',
                'bg-default': colors.slate[100],
                'bg-dialog': '#FFFFFF',
                'bg-hover': chroma(colors.slate[400])
                  .alpha(0.12)
                  .css(),
                'bg-status-bar': colors.slate[300],
              },
              dark: {
                'bg-app-bar': colors.slate[900],
                'bg-card': colors.slate[800],
                'bg-default': colors.slate[900],
                'bg-dialog': colors.slate[800],
                'bg-hover': 'rgba(255, 255, 255, 0.05)',
                'bg-status-bar': colors.slate[900],
              },
            },
            foreground: {
              light: {
                'text-default': colors.slate[800],
                'text-secondary': colors.slate[500],
                'text-hint': colors.slate[400],
                'text-disabled': colors.slate[400],
                border: colors.slate[200],
                divider: colors.slate[200],
                icon: colors.slate[500],
                'mat-icon': colors.slate[500],
              },
              dark: {
                'text-default': '#FFFFFF',
                'text-secondary': colors.slate[400],
                'text-hint': colors.slate[500],
                'text-disabled': colors.slate[600],
                border: chroma(colors.slate[100])
                  .alpha(0.12)
                  .css(),
                divider: chroma(colors.slate[100])
                  .alpha(0.12)
                  .css(),
                icon: colors.slate[400],
                'mat-icon': colors.slate[400],
              },
            },
          },
        },
      },
    };
  }
);

module.exports = theming;
