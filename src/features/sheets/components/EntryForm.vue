<script setup lang="ts">
import { focusFirstInvalid } from '@/lib/forms';
import { discardGuard } from '@/composables/useConfirm';
import { computed, nextTick, ref, watch, type Ref } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { useQuery } from '@tanstack/vue-query';
import { Paperclip, Trash2 } from 'lucide-vue-next';
import type { EntryView } from '@/api/types';
import { sheetsApi } from '@/api/sheets.api';
import { overtimeTypesApi } from '@/api/overtime-types.api';
import { usersApi } from '@/api/users.api';
import { messageFor, fieldErrors } from '@/api/errors';
import { periodBounds, todayIso } from '@/lib/dates';
import { fullName } from '@/lib/format';
import { useToast } from '@/components/ui/useToast';
import {
  Drawer,
  Button,
  FormField,
  Input,
  Textarea,
  Select,
  Combobox,
  DatePicker,
  TimeInput,
} from '@/components/ui';
import { entrySchema, deriveHours } from '../entry.schema';

const props = defineProps<{ open: boolean; sheetId: string; period: string; entry?: EntryView | null }>();
const emit = defineEmits<{ 'update:open': [v: boolean]; saved: [e: EntryView] }>();
const { toast } = useToast();
const types = useQuery({ queryKey: ['overtime-types'], queryFn: () => overtimeTypesApi.list() });
const people = useQuery({
  queryKey: ['users', 'directory'],
  queryFn: () => usersApi.directory(),
});
const typeOptions = computed(() =>
  (types.data.value ?? []).map((t) => ({
    value: t.id,
    label: t.name,
    description: `×${t.multiplier.toFixed(2)}`,
  })),
);
const peopleOptions = computed(() =>
  (people.data.value ?? []).map((u) => ({ value: u.id, label: fullName(u) })),
);
const bounds = computed(() => periodBounds(props.period));

const emptyValues = () => ({
  date: '',
  startTime: '',
  endTime: '',
  overtimeTypeId: '',
  workItem: '',
  workItemUrl: '',
  description: '',
  requestedById: null,
});

const { handleSubmit, defineField, errors, setErrors, resetForm, isSubmitting, meta } = useForm({
  validationSchema: toTypedSchema(entrySchema(props.period, todayIso())),
  initialValues: emptyValues(),
});
const live = { validateOnBlur: true, validateOnModelUpdate: true };
const blurOnly = { validateOnBlur: true, validateOnModelUpdate: false };
// The UI inputs speak `string | null`; the form model speaks `string | undefined`.
function nullable(r: Ref<string | undefined>) {
  return computed<string | null>({ get: () => r.value || null, set: (v) => (r.value = v ?? '') });
}
function text(r: Ref<string | undefined>) {
  return computed<string>({ get: () => r.value ?? '', set: (v) => (r.value = v) });
}
const [dateModel, dateAttrs] = defineField('date', live);
const [startTimeModel, startTimeAttrs] = defineField('startTime', live);
const [endTimeModel, endTimeAttrs] = defineField('endTime', live);
const date = nullable(dateModel);
const startTime = nullable(startTimeModel);
const endTime = nullable(endTimeModel);
const [hours, hoursAttrs] = defineField('hours', live);
const [overtimeTypeIdModel, overtimeTypeIdAttrs] = defineField('overtimeTypeId', blurOnly);
const overtimeTypeId = nullable(overtimeTypeIdModel);
const [workItemModel, workItemAttrs] = defineField('workItem', blurOnly);
const workItem = text(workItemModel);
const [workItemUrlModel, workItemUrlAttrs] = defineField('workItemUrl', blurOnly);
const workItemUrl = text(workItemUrlModel);
const [descriptionModel, descriptionAttrs] = defineField('description', blurOnly);
const description = text(descriptionModel);
const [requestedByIdModel, requestedByIdAttrs] = defineField('requestedById', blurOnly);
const requestedById = computed<string | null>({
  get: () => requestedByIdModel.value ?? null,
  set: (v) => (requestedByIdModel.value = v),
});
function onHours(v: string | number) {
  hours.value = v === '' ? undefined : Number(v);
}
// Kept in script: a literal "https://" in a template attribute trips vue-tsc.
const urlPlaceholder = 'https://';
const formError = ref('');
const lastDerived = ref<number | null>(null);

watch([startTimeModel, endTimeModel], ([s, e]) => {
  if (s && e && (hours.value === undefined || hours.value === lastDerived.value)) {
    const d = deriveHours(s, e);
    if (d > 0) {
      hours.value = d;
      lastDerived.value = d;
    }
  }
});
function clear() {
  formError.value = '';
  lastDerived.value = null;
  resetForm({ values: emptyValues() });
}
watch(
  () => props.open,
  (o) => {
    if (!o) {
      clear();
      return;
    }
    formError.value = '';
    const e = props.entry;
    // Hours keep auto-deriving only while they still equal the last derived value.
    lastDerived.value = e ? deriveHours(e.startTime, e.endTime) : null;
    resetForm({
      values: e
        ? {
            date: e.date,
            startTime: e.startTime,
            endTime: e.endTime,
            hours: e.hours,
            overtimeTypeId: e.overtimeType.id,
            workItem: e.workItem,
            workItemUrl: e.workItemUrl ?? '',
            description: e.description,
            requestedById: e.requestedBy?.id ?? null,
          }
        : emptyValues(),
    });
  },
  { immediate: true },
);

const submit = handleSubmit(async (v) => {
  formError.value = '';
  try {
    const saved = props.entry
      ? await sheetsApi.updateEntry(props.sheetId, props.entry.id, v)
      : await sheetsApi.addEntry(props.sheetId, v);
    toast({ title: props.entry ? 'Entry updated' : 'Entry added', tone: 'success' });
    emit('saved', saved);
    if (props.entry) {
      emit('update:open', false);
    } else {
      clear();
      await nextTick();
      document.getElementById('date')?.focus();
    }
  } catch (e) {
    setErrors(fieldErrors(e));
    formError.value = messageFor(e);
  }
}, focusFirstInvalid);
const guard = discardGuard(() => meta.value.dirty);
async function cancel() {
  if (await guard()) emit('update:open', false);
}

const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
async function upload(ev: Event) {
  const file = (ev.target as HTMLInputElement).files?.[0];
  if (!file || !props.entry) return;
  if (file.size > 5 * 1024 * 1024) {
    toast({ title: 'File is larger than 5 MB', tone: 'error' });
    return;
  }
  uploading.value = true;
  try {
    const att = await sheetsApi.uploadAttachment(props.sheetId, props.entry.id, file);
    emit('saved', { ...props.entry, attachment: att });
    toast({ title: 'Attachment added', tone: 'success' });
  } catch (e) {
    toast({ title: messageFor(e), tone: 'error' });
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
}
async function removeAttachment() {
  if (!props.entry?.attachment) return;
  try {
    await sheetsApi.deleteAttachment(props.sheetId, props.entry.id);
    emit('saved', { ...props.entry, attachment: null });
  } catch (e) {
    toast({ title: messageFor(e), tone: 'error' });
  }
}
</script>
<template>
  <Drawer
    :open="open"
    :title="entry ? 'Edit entry' : 'Add overtime entry'"
    :description="`Period ${period}`"
    :before-close="guard"
    @update:open="emit('update:open', $event)"
  >
    <form id="entry-form" class="space-y-4" novalidate @submit.prevent="submit">
      <p
        v-if="formError"
        role="alert"
        class="rounded-control border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      >
        {{ formError }}
      </p>
      <FormField label="Date" name="date" :error="errors.date" required>
        <template #default="{ id, invalid }">
          <DatePicker
            :id="id"
            v-model="date"
            v-bind="dateAttrs"
            :min="bounds.min"
            :max="bounds.max"
            :invalid="invalid"
          />
        </template>
      </FormField>
      <div class="grid grid-cols-2 gap-3">
        <FormField label="Start" name="startTime" :error="errors.startTime" required>
          <template #default="{ id, invalid }">
            <TimeInput :id="id" v-model="startTime" v-bind="startTimeAttrs" :invalid="invalid" />
          </template>
        </FormField>
        <FormField label="End" name="endTime" :error="errors.endTime" required>
          <template #default="{ id, invalid }">
            <TimeInput :id="id" v-model="endTime" v-bind="endTimeAttrs" :invalid="invalid" />
          </template>
        </FormField>
      </div>
      <FormField
        label="Hours"
        name="hours"
        :error="errors.hours"
        hint="Auto-filled from the times, in 0.25 steps"
        required
      >
        <template #default="{ id, invalid }">
          <Input
            :id="id"
            :model-value="hours ?? ''"
            v-bind="hoursAttrs"
            type="number"
            step="0.25"
            min="0.25"
            max="16"
            mono
            :invalid="invalid"
            @update:model-value="onHours"
          />
        </template>
      </FormField>
      <FormField label="Overtime type" name="overtimeTypeId" :error="errors.overtimeTypeId" required>
        <template #default="{ id, invalid }">
          <Select
            :id="id"
            v-model="overtimeTypeId"
            v-bind="overtimeTypeIdAttrs"
            :options="typeOptions"
            placeholder="Pick a type"
            :invalid="invalid"
          />
        </template>
      </FormField>
      <FormField
        label="Work item"
        name="workItem"
        :error="errors.workItem"
        hint="Ticket key or short reference"
        required
      >
        <template #default="{ id, invalid }">
          <Input
            :id="id"
            v-model="workItem"
            v-bind="workItemAttrs"
            placeholder="PROJ-123"
            :invalid="invalid"
          />
        </template>
      </FormField>
      <FormField label="Work item URL" name="workItemUrl" :error="errors.workItemUrl">
        <template #default="{ id, invalid }">
          <Input
            :id="id"
            v-model="workItemUrl"
            v-bind="workItemUrlAttrs"
            type="url"
            :placeholder="urlPlaceholder"
            :invalid="invalid"
          />
        </template>
      </FormField>
      <FormField label="What did you do?" name="description" :error="errors.description" required>
        <template #default="{ id, invalid }">
          <Textarea :id="id" v-model="description" v-bind="descriptionAttrs" :rows="4" :invalid="invalid" />
        </template>
      </FormField>
      <FormField
        label="Requested by"
        name="requestedById"
        :error="errors.requestedById"
        hint="Optional: the manager who asked for this overtime"
      >
        <template #default="{ id, invalid }">
          <Combobox
            :id="id"
            v-model="requestedById"
            v-bind="requestedByIdAttrs"
            :options="peopleOptions"
            placeholder="Search people"
            :invalid="invalid"
          />
        </template>
      </FormField>
      <div class="rounded-card border p-3">
        <p class="text-sm font-medium">Attachment</p>
        <template v-if="entry">
          <div v-if="entry.attachment" class="mt-2 flex items-center justify-between gap-2 text-sm">
            <span class="flex items-center gap-2 truncate">
              <Paperclip class="h-4 w-4" />{{ entry.attachment.originalName }}
            </span>
            <Button variant="ghost" size="sm" aria-label="Remove attachment" @click="removeAttachment">
              <Trash2 class="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div v-else class="mt-2">
            <input
              ref="fileInput"
              type="file"
              accept="image/png,image/jpeg,application/pdf"
              class="block text-sm"
              :disabled="uploading"
              @change="upload"
            />
            <p class="mt-1 text-xs text-muted-foreground">PNG, JPEG or PDF, max 5 MB</p>
          </div>
        </template>
        <p v-else class="mt-1 text-sm text-muted-foreground">Save the entry, then add an attachment.</p>
      </div>
    </form>
    <template #footer>
      <Button variant="outline" @click="cancel">Cancel</Button>
      <Button type="submit" form="entry-form" :loading="isSubmitting">
        {{ entry ? 'Save changes' : 'Add entry' }}
      </Button>
    </template>
  </Drawer>
</template>
