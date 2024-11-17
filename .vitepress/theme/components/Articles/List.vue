<script setup lang="ts">
import { computed } from 'vue';
import { usePagination } from '../../composables/usePagination';
import { data as posts } from '../../data/posts.data';
import Article from './Article.vue';
import { useData } from 'vitepress';
import { VPButton } from 'vitepress/theme';

const { params, site } = useData();
const pageNumber = computed(() => params.value?.number ? parseInt(params.value.number) : 1);
const pageCount = site.value.contentProps?.articlePerPage ?? 5;
const { paginatedItems, nextPage, prevPage, totalPages } = usePagination(posts, pageNumber.value, pageCount);

const pageUrl = (page: number) => {
    return page === 1 ? '/' : `/page/${page}.html`;
}

</script>

<template>
    <div class="flex flex-col items-center justify-center ">
        <ul class="!list-none max-w-4xl !pl-0">
            <li v-for="post in paginatedItems" :key="post.title">
                <Article :post="post"></Article>
            </li>
        </ul>
        <div class="flex items-center justify-between w-full max-w-4xl">
            <VPButton v-if="prevPage()" theme="alt" size="big" :href="pageUrl(prevPage()!)" text="Prev"></VPButton>
            <span class="invisible" v-else>No Prev</span>
            <p>total pages {{pageNumber}}/{{ totalPages }}</p>
            <VPButton v-if="nextPage()" theme="alt" size="big" :href="pageUrl(nextPage()!)" text="Next"></VPButton>
            <span class="invisible" v-else>No Next</span>
        </div>
    </div>
</template>
