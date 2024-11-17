<script setup lang="ts">
import { VPSocialLinks } from 'vitepress/theme'
import { useData } from 'vitepress'
const { theme } = useData()
</script>
<template>
    <section name="hero" class="flex items-center justify-center flex-col gap-y-4 mt-4 lg:mt-12">
        <img id="avatar" class="w-48" alt="Profile Photo" src="/avatar/avatar@2x.png">
        <div class="text-center">
            <h1 class="text-4xl">Alim Özdemir</h1>
            <p class="!m-0">A software engineer</p>
        </div>
        <VPSocialLinks v-if="theme.socialLinks" class="VPNavScreenSocialLinks" :links="theme.socialLinks" />
    </section>

</template>