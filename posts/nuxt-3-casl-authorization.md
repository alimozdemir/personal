---
layout: doc
title: "Nuxt 3: CASL Authorization"
description: "Implement authorization in Nuxt 3 using the CASL library. This guide covers configuration, Nuxt plugin setup, and usage examples to create a developer-friendly, robust, and extendable authorization system. Perfect for enhancing security and control in your Nuxt applications."
date: '2024-11-22T10:00:00.000Z'
thumbnail: '/img/nuxt-casl/nuxt-casl-hero-image-dorian-mongel-unsplash.jpg'
categories: "Nuxt"
keywords: "nuxt,nuxt3,authorization"
---

# Nuxt 3: CASL Authorization

> It's been very long time that I couldn't write any blog post due to some other priorities. It feels good to be back.

<img src="/img/nuxt-casl/nuxt-casl-hero-image-dorian-mongel-unsplash.jpg" class="hero-image" alt="Photo by Jeff DeWitt on Unsplash" />

## Introduction

Nuxt is a popular web framework that cover a lot of features, although time to time we need some extra plugins/modules or libraries. CASL is one of them, CASL is a agnostic authorization library for Javascript/Typescript. I have been using CASL for more than two years within several projects. In this blog post, I would like to show you how to use CASL in a nuxt project.

End of the blog we would like to achieve developer friendly, robust and extendable authorization.


## Installation

I'm assuming that everyone will apply these changes to an existing project, so I will try to explain in that context

You have to install following packages to your project.

:::code-group

```shell [pnpm]
pnpm install @casl/ability @casl/vue
```

```shell [npm]
npm install @casl/ability @casl/vue
```

:::

## Definitions

First of all, we have to understand how the CASL works. We would like to control the authorization of resources in our project, e.g. 

> [!IMPORTANT]
> Don't forget to check documentation from CASL itself. [Documentation](https://casl.js.org/v6/en/package/casl-vue)

- Can user read this article
- Can user change this article
- Can user `[action]` on `[subject]`

This is the first step to use CASL in your project, by this you would be able to extend all your actions for your all resources.



### Actions

I assume that you have a `types` folder

:::code-group

```ts [types/actions.ts]
export type Actions = 'Read' | 'Write' | 'Delete';
```

:::

### Subjects

:::code-group

```ts [types/subjects.ts]
export type Subjects = 'Account' | 'Profile' | 'Post' | 'Comment';
```

:::


### Ability

Now we can define our CASL interfaces


:::code-group

```ts [types/ability.ts]
import { type AbilityClass, PureAbility, 
    type SubjectRawRule } from "@casl/ability";
import type { Actions } from "./actions";
import type { Subjects } from "./subjects";

export type AppAbility = PureAbility<[Actions, Subjects]>;
export const AppAbility = PureAbility as AbilityClass<AppAbility>;

export type Rule = SubjectRawRule<Actions, Subjects, unknown>;
export type Permission = [Actions, Subjects];
```

:::

So by this, we will have strongly typed functions in our app.

## Nuxt Plugin

So far we would be able to configure CASL to use, and right now we will focus on the nuxt integration.

To be able to use CASL, we have to use `@casl/vue` package.

:::code-group

```ts [plugins/permission.ts]
import { PureAbility } from "@casl/ability";
import { abilitiesPlugin } from "@casl/vue";
import type { Rule } from "~/types/permissions/ability";

export default defineNuxtPlugin(async nuxtApp => {
    const ability = new PureAbility();

    // Define the rules here
    // You can watch your user token (JWT) and update the rules accordingly
    const rules: Rule[] = [];

    /* Get your roles and convert them into rule object accordingly */
    rules.push({ action: 'Read', subject: 'Account' })
    rules.push({ action: 'Write', subject: 'Account' })
    rules.push({ action: 'Read', subject: 'Post' })
    /* Get your roles and convert them into rule object accordingly */
    
    // where the CASL understands your user's abilities
    ability.update(rules)

    // install casl for vue
    nuxtApp.vueApp.use(abilitiesPlugin, ability, {
        useGlobalProperties: true
    });
});
```

:::

In the plugin you have to configure your user's abilities. Most of my cases I was parsing JWT token of the user and get all the roles, based on the roles I was configuring abilities. So, this part depends on your `Authentication` approach.

## Composable

:::code-group

```ts [composables/useAppAbilitiy.ts]
import { useAbility } from "@casl/vue";
import type { AppAbility } from "~~/types/permissions/ability";

export const useAppAbility = () => useAbility<AppAbility>();
```

:::

By this we will be able to check user's authorization on typescript.

## `$can` global property

Until now, we're ready to test CASL in an action. If you check the plugin, you can see that the user will have three permission set. And we can see that the user has Post Read permission, so this button will be rendered.

```html
<button v-if="$can('Read', 'Post')">View post</button>
```

This won't be rendered since the user does not have Write access to the Post.

```html
<button v-if="$can('Write', 'Post')">Edit post</button>
```

You might noticed that there is no intellisense for $can function, to be able to have an intellisense. You have to prepare your declaration for typescript. You can use your *.d.ts files to do that, here how you can achieve that.

:::code-group
```ts [index.d.ts]
import type { AppAbility } from './types/permissions/ability'

declare module 'vue' {
    interface ComponentCustomProperties {
        $ability: AppAbility;
        $can(this: this, ...args: Parameters<this['$ability']['can']>): boolean;
    }
}

export { }
```
:::

Now we can just see that intellisense also works

<img src="/img/nuxt-casl/intellisense.png" class="center-image" alt="Nuxt CASL $can intellisense" />

For the advance cases that you would like to reach more functions from casl you can use `$ability` global variable

<img src="/img/nuxt-casl/ability-global.png" class="center-image" alt="Nuxt CASL $ability intellisense" />


## Middleware and page protection

So far, so good. We could also extend this logic into nuxt pages. That would give us a good way of handling authorization.

As everyone knows, in the nuxt we have `definePageMeta` that gives us good way of defining page properties. We could add another parameter there by declaration as well. Although, currently it is not working well. Anyway I will show how to do it.

:::code-group
```ts [index.d.ts]

...
import type { Permission } from './types/permissions/ability'

// Known issue: https://github.com/nuxt/nuxt/discussions/19949
declare module '#app' {
    interface PageMeta {
        permission?: Permission,
    }
}
...

export { }
```
:::

Even without declartion you can just use `permission` property

:::code-group
```ts [auth.vue]
<script setup lang="ts">

definePageMeta({
    name: 'auth',
    permission: ['Read', 'Comment'],
})

</script>
```
:::

Now we need a middleware to check the permission by abilities.

:::code-group
```ts [middleware/guard.global.ts]
import type { Actions } from "~~/types/permissions/actions";
import type { Subjects } from "~~/types/permissions/subjects";

export default defineNuxtRouteMiddleware((to, from) => {
    const ability = useAppAbility();
    const checkPermission = computed(() => {
        if (!to.meta.permission || !Array.isArray(to.meta.permission) || 
            !to.meta.permission[0] || !to.meta.permission[1]) return true;
    
        const action = to.meta.permission[0] as Actions;
        const subject = to.meta.permission[1] as Subjects;
        
        return ability.can(action, subject);
    });

    if ((to.path != from.path || import.meta.server) && to.meta.permission) {
        
        if (checkPermission.value) return;
        return abortNavigation({
            statusCode: 403,
            fatal: true,
            message: 'You are not allowed to access this page'
        });
    }
});
```
:::


Once you try to access `/auth` page you will endup with following screen, you can customize it based on your needs.

<img src="/img/nuxt-casl/403.png" class="center-image" alt="Nuxt CASL 403 page" />

## Source code

You can check out a complete example in my github repo. [nuxt-casl-sample](https://github.com/alimozdemir/nuxt-casl-sample)