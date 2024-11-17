<script setup lang="ts">
import { Post, data as posts } from '../../data/posts.data';
import { VPButton } from 'vitepress/theme';
import { useData } from 'vitepress';
import { computed } from 'vue';

const { frontmatter } = useData();

const post = computed(() => {
    return posts.findIndex((p: Post) => p.title === frontmatter.value?.title);
});

const prevPage = () => {
    return post.value > 0 ? posts[post.value - 1] : undefined;
}

const nextPage = () => {
    return post.value < posts.length - 1 ? posts[post.value + 1] : undefined;
}
</script>
<template>
    <div class="container flex items-center justify-between mx-auto max-w-3xl w-full pb-8">
        <VPButton v-if="prevPage()" theme="alt" size="big" :href="prevPage()?.url" text="Prev"></VPButton>
        <span class="invisible" v-else>No Prev</span>

        <VPButton v-if="nextPage()" theme="alt" size="big" :href="nextPage()?.url" text="Next"></VPButton>
        <span class="invisible" v-else>No Next</span>
    </div>
</template>