// https://vitepress.dev/guide/custom-theme
import Layout from './Layout.vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'
import './tailwind.css'
import ArticlesList from './components/Articles/List.vue'
import Hero from './components/Hero.vue'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app, router, siteData }) {

    app.component('ArticlesList', ArticlesList);
    app.component('Hero', Hero);

  }
} satisfies Theme

