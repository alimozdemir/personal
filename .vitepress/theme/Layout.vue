<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import SharedTitle from './components/Shared/Title.vue'
import ArticlesInfo from './components/Articles/Info.vue'
import ArticlesNav from './components/Articles/Nav.vue'

const { site, frontmatter } = useData()
const { Layout } = DefaultTheme;

</script>

<template>
  <Layout>
    <template #nav-bar-title-before>
    </template>
    <template #doc-top>
      <ArticlesInfo v-if="frontmatter.layout === 'doc'" class="xl:hidden"></ArticlesInfo>
    </template>
    <template #doc-bottom>
      <ArticlesNav v-if="frontmatter.layout === 'doc'"></ArticlesNav>
    </template>
    <template #aside-top>
      <ArticlesInfo v-if="frontmatter.layout === 'doc'" class="hidden xl:flex"></ArticlesInfo>
    </template>
    <template #nav-bar-title-after>
      <SharedTitle></SharedTitle>
    </template>
  </Layout>
</template>
