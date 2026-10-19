<script setup lang="ts">
import { h } from 'vue';
import type { ColumnDef } from '@tanstack/vue-table';
import { Paperclip, Pencil, Trash2, ExternalLink } from 'lucide-vue-next';
import type { EntryView } from '@/api/types';
import { formatDate, formatHours } from '@/lib/format';
import { DataTable, Badge, Button } from '@/components/ui';
const props = defineProps<{ entries: EntryView[]; editable: boolean; loading?: boolean }>();
const emit = defineEmits<{ edit: [e: EntryView]; remove: [e: EntryView]; openAttachment: [id: string] }>();
const columns: ColumnDef<EntryView, unknown>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => h('span', { class: 'num' }, formatDate(row.original.date)),
  },
  {
    id: 'time',
    header: 'Time',
    cell: ({ row }) => h('span', { class: 'num' }, `${row.original.startTime}–${row.original.endTime}`),
  },
  {
    accessorKey: 'hours',
    header: 'Hours',
    meta: { numeric: true },
    cell: ({ row }) => formatHours(row.original.hours),
  },
  {
    id: 'type',
    header: 'Type',
    cell: ({ row }) =>
      h(Badge, { tone: 'info' }, () => `${row.original.overtimeType.name} ×${row.original.multiplier}`),
  },
  {
    accessorKey: 'weightedHours',
    header: 'Weighted',
    meta: { numeric: true },
    cell: ({ row }) => formatHours(row.original.weightedHours),
  },
  {
    id: 'work',
    header: 'Work item',
    cell: ({ row }) =>
      row.original.workItemUrl && /^https?:\/\//i.test(row.original.workItemUrl)
        ? h(
            'a',
            {
              href: row.original.workItemUrl,
              target: '_blank',
              rel: 'noopener',
              class: 'inline-flex items-center gap-1 text-secondary hover:underline',
              onClick: (e: Event) => e.stopPropagation(),
            },
            [row.original.workItem, h(ExternalLink, { class: 'h-3.5 w-3.5' })],
          )
        : row.original.workItem,
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'block max-w-[28ch] truncate', title: row.original.description },
        row.original.description,
      ),
  },
  {
    id: 'attachment',
    header: '',
    cell: ({ row }) =>
      row.original.attachment
        ? h(
            'button',
            {
              type: 'button',
              class:
                'flex h-11 w-11 items-center justify-center rounded-control hover:bg-muted cursor-pointer',
              'aria-label': `Open ${row.original.attachment.originalName}`,
              onClick: (e: Event) => {
                e.stopPropagation();
                emit('openAttachment', row.original.attachment!.id);
              },
            },
            [h(Paperclip, { class: 'h-4 w-4' })],
          )
        : null,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      props.editable
        ? h('div', { class: 'flex justify-end gap-1' }, [
            h(
              Button,
              {
                variant: 'ghost',
                size: 'sm',
                'aria-label': 'Edit entry',
                onClick: (e: Event) => {
                  e.stopPropagation();
                  emit('edit', row.original);
                },
              },
              () => h(Pencil, { class: 'h-4 w-4' }),
            ),
            h(
              Button,
              {
                variant: 'ghost',
                size: 'sm',
                'aria-label': 'Delete entry',
                onClick: (e: Event) => {
                  e.stopPropagation();
                  emit('remove', row.original);
                },
              },
              () => h(Trash2, { class: 'h-4 w-4 text-destructive' }),
            ),
          ])
        : null,
  },
];
</script>
<template>
  <DataTable
    :columns="columns"
    :rows="entries"
    :row-key="(e) => e.id"
    :loading="loading"
    empty-title="No entries yet"
    :empty-description="editable ? 'Add your first overtime entry for this month.' : undefined"
  >
    <template #empty-action><slot name="empty-action" /></template>
  </DataTable>
</template>
