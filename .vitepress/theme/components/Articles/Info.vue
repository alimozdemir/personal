<script setup lang="ts">
import { useData } from 'vitepress';
import { formatDate } from '../../data/utils';
import { computed } from 'vue';

const { frontmatter } = useData();

const categories = computed(() => frontmatter.value?.categories?.split(','));
const date = frontmatter.value?.date ? formatDate(frontmatter.value.date) : undefined;
</script>
<template>
    <div class="info-box flex flex-row-reverse items-center justify-between mb-4 xl:flex-col xl:items-start xl:pb-4">
        <div class="py-4 flex" v-if="categories">
            <span v-for="item in categories" v-text="item" class="text-sm rounded border p-2"></span>
        </div>
        <div>
            <span v-text="date?.string"></span>
        </div>
    </div>
</template>

<style lang="css" scoped>
.info-box {
    border-bottom: 1px solid var(--vp-c-divider);
}
</style>