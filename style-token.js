const StyleDictionaryPackage = require('style-dictionary')
const global = require('./styles/tokens/global.json')
const light = require('./styles/tokens/light.json')
const dark = require('./styles/tokens/dark.json')

const supportedTokenTypeList = [
  'colors',
  'boxShadow',
  'sizing',
  'color',
  'borderRadius',
  'borderWidth',
  'opacity',
  'fontFamilies',
]

const formatValue = (tokenType, value) => {
  let formattedValue
  switch (tokenType) {
    case 'boxShadow':
      /*
       * offset-x | offset-y | blur-radius | spread-radius | color
       * box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.2);
       */
      formattedValue = `${value.x} ${value.y} ${value.blur} ${value.spread} ${value.color}`
      break
    case 'sizing':
    case 'color':
    case 'borderRadius':
    case 'borderWidth':
    case 'opacity':
    case 'fontFamilies':
    default:
      formattedValue = value
  }
  return formattedValue
}

/**
 * Custom format that handle reference in css variables
 */
StyleDictionaryPackage.registerFormat({
  name: 'css/variables',
  formatter({ dictionary }) {
    return `${this.selectorName} {
      ${dictionary.allProperties
        .map((token) => {
          const value = formatValue(token.type, token.value)

          if (dictionary.usesReference(token.original.value)) {
            const reference = dictionary.getReferences(token.original.value)
            const referenceName = reference[0].name
            return `  --${token.name}: var(--${referenceName}, ${value});`
          }

          return `  --${token.name}: ${value};`
        })
        .join('\n')}
    }`
  },
})

/**
 * Custom format that generate tailwind color config based on css variables
 */
StyleDictionaryPackage.registerFormat({
  name: 'tw/css-variables',
  formatter({ dictionary }) {
    return (
      'module.exports = '
      + `{\n${
        dictionary.allProperties
          .map((token) => {
            const value = formatValue(token.type, token.value)
            return `  "${token.path
              .slice(1)
              .join('-')}": "var(--${token.name}, ${value});"`
          })
          .join(',\n')
         }\n}`
    )
  },
})

/**
 * Returns the files configuration
 * for generating seperated tailwind files.
 */
function getConfigTailwindFilesByType(typeList) {
  return typeList.map((typeName) => {
    return {
      destination: `tw-extend/${typeName}.js`,
      format: 'tw/css-variables',
      filter: {
        type: typeName,
      },
    }
  })
}

// HAVE THE STYLE DICTIONARY CONFIG DYNAMICALLY GENERATED
function getStyleDictionaryConfig(tokensConfig = {}) {
  const { brand, buildTailwindFiles, tokens, selectorName } = tokensConfig

  let configTailwindFilesByType = []

  if (buildTailwindFiles) {
    configTailwindFilesByType = getConfigTailwindFilesByType(
      supportedTokenTypeList,
    )
  }

  return {
    tokens,
    platforms: {
      web: {
        transformGroup: 'web',
        prefix: 'ui',
        buildPath: './styles/',
        files: [
          {
            destination: `${brand}-variables.css`,
            format: 'css/variables',
            selectorName,
          },
          ...configTailwindFilesByType,
        ],
      },
    },
  }
}

console.log('Build started...')

const configs = [
  // PROCESS THE DESIGN TOKENS FOR THE DIFFEREN BRANDS AND PLATFORMS
  {
    brand: 'global',
    buildTailwindFiles: true,
    selectorName: ':root',
    tokens: convertFigmaExportReferenceToStyleDictionaryReference(global),
  },
  {
    brand: 'light',
    buildTailwindFiles: true,
    selectorName: '[data-theme="light"]',
    tokens: convertFigmaExportReferenceToStyleDictionaryReference(light),
  },
  {
    brand: 'dark',
    buildTailwindFiles: true,
    selectorName: '[data-theme="dark"]',
    tokens: convertFigmaExportReferenceToStyleDictionaryReference(dark),
  },
]

configs.map((config) => {
  console.log('\n==============================================')
  console.log(`\nProcessing:  [Web] [${config.brand}]`)

  const StyleDictionary = StyleDictionaryPackage.extend(
    getStyleDictionaryConfig(config),
  )

  StyleDictionary.buildPlatform('web')

  console.log('\nEnd processing')
})

console.log('\n==============================================')
console.log('\nBuild completed!')

/**
 * Figma export reference as following
 * "{color.neutral-95}"
 * Style dictionary expect the reference as following
 * "{color.neutral-95.value}"
 * So we convert it to the correct format
 */
function convertFigmaExportReferenceToStyleDictionaryReference(tokens = '') {
  const convertTokens = JSON.parse(
    JSON.stringify(tokens).replace(/}",/g, '.value}",'),
  )
  return convertTokens
}
