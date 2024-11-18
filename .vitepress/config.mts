import { defineConfig } from 'vitepress'
import { NUMBER_OF_ARTICLES_PER_PAGE } from '../consts'

const GA_MEASUREMENT_ID = 'G-N7367JX5TN'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Alim Özdemir",
  description: "Alim Özdemir Personal Website",
  cleanUrls: true,
  contentProps: {
    articlePerPage: NUMBER_OF_ARTICLES_PER_PAGE
  },
  head: [
    ['script', {
      src: `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`,
      async: 'true'
    }],
    [
      'script',
      {},
      `window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', '${GA_MEASUREMENT_ID}');`,
    ],
  ],
  transformHead(pageData) {
    const canonicalUrl = `https://www.alimozdemir.com/${pageData.pageData.relativePath}`
    .replace(/index\.md$/, '')
    .replace(/\.md$/, '');
    const ogTitle = pageData.title || 'Alim Özdemir';
    const ogDescription = pageData.description || 'Alim Özdemir Personal Website';
    const ogUrl = canonicalUrl || 'https://www.alimozdemir.com';
    const ogImage = pageData.pageData.frontmatter.thumbnail || 'https://www.alimozdemir.com/img/default.png'; 

    return [
      ['meta', { property: 'og:title', content: ogTitle }],
      ['meta', { property: 'og:description', content: ogDescription }],
      ['meta', { property: 'og:url', content: ogUrl }],
      ['meta', { property: 'og:image', content: ogImage }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:title', content: ogTitle }],
      ['meta', { name: 'twitter:description', content: ogDescription }],
      ['meta', { name: 'twitter:url', content: ogUrl }],
      ['meta', { name: 'twitter:image', content: ogImage }],

      ['meta', { name: 'twitter:site', content: '@almozdmr' }],
    ];
  },
  themeConfig: {
    socialLinks: [{
      icon: 'github',
      link: 'https://www.github.com/alimozdemir',
    }, {
      icon: 'linkedin',
      link: 'https://www.linkedin.com/in/almozdmr/'
    }, {
      icon: 'twitter',
      link: 'https://www.twitter.com/almozdmr'
    }],
    footer: {
      copyright: 'Copyright © 2019-present Alim Özdemir'
    },
    nav: [{
      text: 'Home',
      link: '/'
    }, {
      text: 'About',
      link: '/about'
    }],
    search: {
      provider: 'local'
    },
  },
  sitemap: {
    hostname: 'https://www.alimozdemir.com'
  }
})
