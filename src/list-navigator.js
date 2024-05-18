export function current(list, index) {
    if (list.length === 0) return null;
    return list[index];
}

export function next(list, index) {
    if (list.length === 0) return { newIndex: index, element: null };
    const newIndex = (index + 1) % list.length;
    return { newIndex, element: list[newIndex] };
}

export function previous(list, index) {
    if (list.length === 0) return { newIndex: index, element: null };
    const newIndex = (index - 1 + list.length) % list.length;
    return { newIndex, element: list[newIndex] };
}