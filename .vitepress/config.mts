import { defineConfig } from 'vitepress'
import { NUMBER_OF_ARTICLES_PER_PAGE } from '../consts'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Alim Özdemir",
  description: "Alim Özdemir Personal Website",
  cleanUrls: true,
  contentProps: {
    articlePerPage: NUMBER_OF_ARTICLES_PER_PAGE
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
  }
})
