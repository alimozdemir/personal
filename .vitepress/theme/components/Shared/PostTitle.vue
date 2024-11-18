<script setup lang="ts">
import { useRouter } from 'vitepress'
import { onMounted, onUnmounted, ref, watch } from 'vue';

const titleElement = ref()
const showPostTitle = ref(false)

const router = useRouter();

watch(() => router.route.path, (path) => {
    showPostTitle.value = false
    titleElement.value = document.querySelector('h1');
    console.log('router.route.path', document)
}, {
    immediate: true
})

onMounted(() => {
    titleElement.value = document.querySelector('h1');
    window.addEventListener('scroll', listenScroll)
})

const listenScroll = () => {
    if (window.innerWidth > 960 && titleElement.value) {
        const rect = titleElement.value.getBoundingClientRect()
        showPostTitle.value = rect.top < 0
    }
}

onUnmounted(() => {
    window.removeEventListener('scroll', listenScroll)
})

watch(showPostTitle, (show) => {
    document.querySelector('.name-title')?.classList.toggle('hidden', show)
    document.querySelector('.post-title')?.classList.toggle('hidden', !show)
})

</script>
<template>

</template>