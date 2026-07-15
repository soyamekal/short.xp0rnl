<script setup>
import { DependencyType } from '@/components/ui/auto-form/interface'
import { LinkSchema, nanoid } from '@/schemas/link'
import { toTypedSchema } from '@vee-validate/zod'
import { Shuffle, Sparkles } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { toast } from 'vue-sonner'
import { z } from 'zod'

const props = defineProps({
  link: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:link'])

const link = ref(props.link)
const dialogOpen = ref(false)

const uploadedImage = ref(props.link.image || '')

const isEdit = !!props.link.id

const EditLinkSchema = LinkSchema.pick({
  url: true,
  slug: true,
  title: true,
  description: true,
  image: true,
}).extend({
  optional: LinkSchema.omit({
    id: true,
    url: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
    title: true,
    description: true,
    image: true,
  }).extend({
    expiration: z.coerce.date().optional(),
  }).optional(),
})

const fieldConfig = {
  slug: {
    disabled: isEdit,
  },
  optional: {
    comment: {
      component: 'textarea',
    },
  },
}

const dependencies = [
  {
    sourceField: 'slug',
    type: DependencyType.DISABLES,
    targetField: 'slug',
    when: () => isEdit,
  },
]

const form = useForm({
  validationSchema: toTypedSchema(EditLinkSchema),
  initialValues: {
    slug: link.value.slug,
    url: link.value.url,
    title: link.value.title,
    description: link.value.description,
    image: link.value.image,
    optional: {
      comment: link.value.comment,
    },
  },
  validateOnMount: isEdit,
  keepValuesOnUnmount: isEdit,
})


function randomSlug() {
  form.setFieldValue('slug', nanoid()())
}


const aiSlugPending = ref(false)

async function aiSlug() {
  if (!form.values.url)
    return

  aiSlugPending.value = true

  try {
    const { slug } = await useAPI('/api/link/ai', {
      query: {
        url: form.values.url,
      },
    })

    form.setFieldValue('slug', slug)

  }
  catch (error) {
    console.log(error)
  }

  aiSlugPending.value = false
}


// IMAGE UPLOAD

async function handleImageUpload(event) {

  const file = event.target.files[0]

  if (!file)
    return


  const imageData = new FormData()

  imageData.append('image', file)


  try {

    const response = await fetch(
      'https://url222xx.com/upload.php',
      {
        method: 'POST',
        body: imageData,
      }
    )


    const data = await response.json()


    if (data.success) {

      uploadedImage.value = data.url

      form.setFieldValue(
        'image',
        data.url
      )

      toast('Image uploaded successfully')

    }
    else {

      toast(data.message)

    }


  }
  catch(error) {

    console.log(error)

    toast('Image upload failed')

  }

}



onMounted(() => {

  if (link.value.expiration) {

    form.setFieldValue(
      'optional.expiration',
      unix2date(link.value.expiration)
    )

  }

})


async function onSubmit(formData) {


  const link = {

    url: formData.url,

    slug: formData.slug,

    title: formData.title,

    description: formData.description,

    image: formData.image,

    ...(formData.optional || {}),

    expiration: formData.optional?.expiration
      ? date2unix(formData.optional?.expiration, 'end')
      : undefined,

  }



  const { link: newLink } =
    await useAPI(
      isEdit
        ? '/api/link/edit'
        : '/api/link/create',
      {
        method: isEdit ? 'PUT' : 'POST',
        body: link,
      }
    )


  dialogOpen.value = false


  emit(
    'update:link',
    newLink
  )


  if (isEdit) {

    toast('Link updated successfully')

  }
  else {

    toast('Link created successfully')

  }

}


const { previewMode } = useRuntimeConfig().public

</script>


<template>

<Dialog v-model:open="dialogOpen">


<DialogTrigger as-child>

<slot>

<Button
class="ml-2"
variant="outline"
@click="randomSlug"
>
Create Link
</Button>

</slot>

</DialogTrigger>



<DialogContent
class="max-w-[95svw] max-h-[95svh] md:max-w-lg grid-rows-[auto_minmax(0,1fr)_auto]"
>


<DialogHeader>

<DialogTitle>

{{ link.id ? 'Edit Link' : 'Create Link' }}

</DialogTitle>

</DialogHeader>



<p
v-if="previewMode"
class="text-sm text-muted-foreground"
>
The preview mode link is valid for up to 24 hours.
</p>



<AutoForm
class="px-2 space-y-2 overflow-y-auto"
:schema="EditLinkSchema"
:form="form"
:field-config="fieldConfig"
:dependencies="dependencies"
@submit="onSubmit"
>



<div class="space-y-2">

<label class="text-sm font-medium">
Upload Image
</label>


<input
type="file"
accept="image/*"
@change="handleImageUpload"
/>


<img
v-if="uploadedImage"
:src="uploadedImage"
class="w-32 rounded-md mt-2"
/>


</div>




<template #slug="slotProps">

<div
v-if="!isEdit"
class="relative"
>

<div class="absolute right-0 flex space-x-3 top-1">

<Shuffle
class="w-4 h-4 cursor-pointer"
@click="randomSlug"
/>


<Sparkles
class="w-4 h-4 cursor-pointer"
:class="{ 'animate-bounce': aiSlugPending }"
@click="aiSlug"
/>

</div>


<AutoFormField
v-bind="slotProps"
/>


</div>

</template>




<DialogFooter>


<DialogClose as-child>

<Button
type="button"
variant="secondary"
class="mt-2 sm:mt-0"
>
Close
</Button>


</DialogClose>



<Button type="submit">

Save

</Button>


</DialogFooter>



</AutoForm>


</DialogContent>


</Dialog>


</template>
