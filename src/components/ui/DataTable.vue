<script setup lang="ts" generic="T">
import { computed, getCurrentInstance, ref } from 'vue';
import {
  FlexRender,
  getCoreRowModel,
  getSortedRowModel,
  useVueTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/vue-table';
import { ArrowUpDown, ArrowUp, ArrowDown, AlertCircle, ChevronRight } from 'lucide-vue-next';
import Skeleton from './Skeleton.vue';
import EmptyState from './EmptyState.vue';
import Button from './Button.vue';

const props = withDefaults(
  defineProps<{
    columns: ColumnDef<T, unknown>[];
    rows: T[];
    rowKey: (r: T) => string;
    loading?: boolean;
    error?: string | null;
    emptyTitle?: string;
    emptyDescription?: string;
    sortable?: boolean;
    expandable?: boolean;
  }>(),
  { emptyTitle: 'Nothing here', sortable: false, error: null, emptyDescription: undefined },
);
const emit = defineEmits<{ retry: []; rowClick: [row: T] }>();

// rowClick is a declared emit, so Vue removes onRowClick from $attrs; read the vnode props instead.
const clickable = computed(() => Boolean(getCurrentInstance()?.vnode.props?.onRowClick));

const sorting = ref<SortingState>([]);
const expanded = ref<Set<string>>(new Set());
const table = useVueTable({
  get data() {
    return props.rows;
  },
  get columns() {
    return props.columns;
  },
  state: {
    get sorting() {
      return sorting.value;
    },
  },
  onSortingChange: (u) => {
    sorting.value = typeof u === 'function' ? u(sorting.value) : u;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  enableSorting: props.sortable,
  getRowId: (r) => props.rowKey(r),
});

const isNumeric = (meta: unknown) => Boolean((meta as { numeric?: boolean } | undefined)?.numeric);
const ariaSort = (s: false | 'asc' | 'desc') =>
  s === 'asc' ? 'ascending' : s === 'desc' ? 'descending' : 'none';
const colCount = computed(() => props.columns.length + (props.expandable ? 1 : 0));
function toggle(id: string) {
  const n = new Set(expanded.value);
  if (n.has(id)) n.delete(id);
  else n.add(id);
  expanded.value = n;
}
</script>

<template>
  <div class="overflow-x-auto rounded-card border bg-surface shadow-card">
    <table class="w-full min-w-[640px] border-collapse text-base">
      <thead class="bg-muted/60 text-sm text-muted-foreground">
        <tr>
          <th v-if="expandable" class="w-10" />
          <th
            v-for="h in table.getFlatHeaders()"
            :key="h.id"
            scope="col"
            class="px-4 py-3 text-left font-medium"
            :class="isNumeric(h.column.columnDef.meta) ? 'text-right' : ''"
            :aria-sort="sortable && h.column.getCanSort() ? ariaSort(h.column.getIsSorted()) : undefined"
          >
            <button
              v-if="sortable && h.column.getCanSort()"
              type="button"
              class="inline-flex min-h-11 cursor-pointer items-center gap-1 hover:text-foreground"
              @click="h.column.toggleSorting()"
            >
              <FlexRender :render="h.column.columnDef.header" :props="h.getContext()" />
              <ArrowUp v-if="h.column.getIsSorted() === 'asc'" class="h-4 w-4" />
              <ArrowDown v-else-if="h.column.getIsSorted() === 'desc'" class="h-4 w-4" />
              <ArrowUpDown v-else class="h-4 w-4 opacity-50" />
            </button>
            <FlexRender v-else :render="h.column.columnDef.header" :props="h.getContext()" />
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-if="loading">
          <tr v-for="i in 5" :key="i" class="border-t">
            <td :colspan="colCount" class="px-4 py-3"><Skeleton /></td>
          </tr>
        </template>
        <tr v-else-if="error" class="border-t">
          <td :colspan="colCount" class="px-4 py-8">
            <div class="flex flex-col items-center gap-3 text-center">
              <AlertCircle class="h-6 w-6 text-destructive" />
              <p>{{ error }}</p>
              <Button variant="outline" size="sm" @click="emit('retry')">Retry</Button>
            </div>
          </td>
        </tr>
        <tr v-else-if="rows.length === 0" class="border-t">
          <td :colspan="colCount">
            <EmptyState :title="emptyTitle" :description="emptyDescription">
              <template #action><slot name="empty-action" /></template>
            </EmptyState>
          </td>
        </tr>
        <template v-else>
          <template v-for="row in table.getRowModel().rows" :key="row.id">
            <tr
              class="border-t transition-colors hover:bg-muted/40"
              :class="
                clickable
                  ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  : ''
              "
              :tabindex="clickable ? 0 : undefined"
              @click="emit('rowClick', row.original)"
              @keydown.enter.self.prevent="clickable && emit('rowClick', row.original)"
              @keydown.space.self.prevent="clickable && emit('rowClick', row.original)"
            >
              <td v-if="expandable" class="px-2">
                <button
                  type="button"
                  class="flex h-11 w-8 cursor-pointer items-center justify-center"
                  :aria-expanded="expanded.has(row.id)"
                  aria-label="Toggle details"
                  @click.stop="toggle(row.id)"
                >
                  <ChevronRight
                    class="h-4 w-4 transition-transform"
                    :class="expanded.has(row.id) ? 'rotate-90' : ''"
                  />
                </button>
              </td>
              <td
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="px-4 py-3 align-middle"
                :class="isNumeric(cell.column.columnDef.meta) ? 'num text-right' : ''"
              >
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </td>
            </tr>
            <tr v-if="expandable && expanded.has(row.id)" class="border-t bg-muted/30">
              <td :colspan="colCount" class="px-4 py-3">
                <slot name="expanded" :row="row.original" />
              </td>
            </tr>
          </template>
        </template>
      </tbody>
      <tfoot v-if="$slots.footer && !loading && !error" class="border-t bg-muted/40">
        <tr>
          <slot name="footer" />
        </tr>
      </tfoot>
    </table>
  </div>
</template>
