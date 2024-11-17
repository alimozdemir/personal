<script setup lang="ts">
import { Post } from '../../data/posts.data';

defineProps<{
    post: Post
}>();

</script>

<template>
    <a class="inline-block w-full article group" :href="post.url">
        <div class="content">
            <h3 class="text-xl font-semibold !mt-0">{{ post.title }}</h3>
            <p class="text-sm" v-text="post.description"></p>
        </div>
        <div class="flex order-first md:order-last flex-col-reverse md:flex-col">
            <div class="thumbnail shadow group-hover:drop-shadow">
                <img :src="post.thumbnail" :alt="post.title" />
            </div>
            <span class="text place-self-end pt-1 font-semibold text-sm" v-text="post.date.string"></span>
        </div>
    </a>
</template>

<style scoped>
.article {
    color: var(--vp-c-text-1);
    @apply grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4 p-4 rounded-lg items-center;
    @apply no-underline;
}

.article:hover {
    color: var(--vp-c-text-2);
}

.thumbnail {
    @apply h-28 md:h-48 overflow-hidden rounded-lg;
}

.thumbnail img {
    @apply w-full h-full object-cover;
}
</style>