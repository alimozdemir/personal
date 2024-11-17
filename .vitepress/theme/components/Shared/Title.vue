<script setup lang="ts">
import { useData } from 'vitepress';
import PostTitle from './PostTitle.vue';

const { site, frontmatter } = useData();
</script>
<template>
    <template v-if="frontmatter.layout !== 'home'">
        <ClientOnly>
            <PostTitle></PostTitle>
        </ClientOnly>
        <img id="avatar" class="w-10" alt="Profile Photo" src="/avatar/avatar.png">
        <span class="name-title pl-4">Alim Özdemir</span>
        <span class="post-title pl-4 hidden">{{ frontmatter.title }}</span>
    </template>
</template>