export function rehypeTocExport() {
    return (tree, file) => {
        file.data.fm = file.data.fm || {};
        file.data.fm.toc = file.data.toc || [];
    }
}

export default rehypeTocExport;
