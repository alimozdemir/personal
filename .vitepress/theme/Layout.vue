<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import SharedTitle from './components/Shared/Title.vue'
import ArticlesInfo from './components/Articles/Info.vue'

const { site, frontmatter } = useData()
const { Layout } = DefaultTheme;

</script>

<template>
  <Layout>
    <template #nav-bar-title-before>
    </template>
    <template #doc-top>
      <ArticlesInfo v-if="frontmatter.layout != 'home'" class="xl:hidden"></ArticlesInfo>
    </template>
    <template #aside-top>
      <ArticlesInfo v-if="frontmatter.layout != 'home'" class="hidden xl:flex"></ArticlesInfo>
    </template>
    <template #nav-bar-title-after>
      <SharedTitle></SharedTitle>
    </template>
  </Layout>
</template>
