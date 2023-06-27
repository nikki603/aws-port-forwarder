export function sort(items: any[], getSortPropertyCallback: (item: any) => string): any[] {
    return items.sort((a, b) => {
        const sortA: string = getSortPropertyCallback(a) || '';
        const sortB: string = getSortPropertyCallback(b) || '';

        return sortA ? sortB ? sortA.localeCompare(sortB) : -1 : 1;
    });
}