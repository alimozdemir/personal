import { ref, computed } from 'vue'

export function usePagination<T>(items: T[], currentPage: number, itemsPerPage: number = 5) {
  const totalPages = computed(() => Math.ceil(items.length / itemsPerPage))
  
  const paginatedItems = computed(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return items.slice(start, end)
  })

  function nextPage() {
    if (currentPage < totalPages.value) {
      return currentPage + 1;
    }
  }

  function prevPage() {
    if (currentPage > 1) {
      return currentPage - 1;
    }
  }

  return {
    currentPage,
    totalPages,
    paginatedItems,
    nextPage,
    prevPage
  }
}