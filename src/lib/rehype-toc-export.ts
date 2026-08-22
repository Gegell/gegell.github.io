import type { Root } from 'hast';
import type { VFile } from 'vfile';

type TocFileData = {
	fm?: Record<string, unknown>;
	toc?: unknown[];
};

type TocFile = VFile & {
	data: VFile['data'] & TocFileData;
};

export function rehypeTocExport() {
	return (_tree: Root, file: TocFile): void => {
		file.data.fm ??= {};
		file.data.fm.toc = file.data.toc ?? [];
	};
}

export default rehypeTocExport;
