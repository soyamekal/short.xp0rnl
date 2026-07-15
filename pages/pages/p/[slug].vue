<script setup lang="ts">
const route = useRoute()

const { data: link } = await useFetch(`/api/link/preview`, {
  query: {
    slug: route.params.slug,
  },
})

if (!link.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Link not found',
  })
}

useSeoMeta({
  title: link.value.title || 'Redirecting...',
  description: link.value.description || '',
  ogTitle: link.value.title || '',
  ogDescription: link.value.description || '',
  ogImage: link.value.image || '',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: link.value.title || '',
  twitterDescription: link.value.description || '',
  twitterImage: link.value.image || '',
})

onMounted(() => {
  setTimeout(() => {
    window.location.href = link.value.url
  }, 1000)
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <h1 class="text-2xl font-bold">
        {{ link.title }}
      </h1>

      <p class="mt-3">
        {{ link.description }}
      </p>

      <p class="mt-8 text-sm text-gray-500">
        Redirecting...
      </p>
    </div>
  </div>
</template>
