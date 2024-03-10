import * as fs from 'fs'

export const FILE_FILTERS: {
    name: string;
    extensions: string[];
}[] = [
        { name: 'JPEG', extensions: ['jpg', 'jpeg'] },
        { name: 'PNG', extensions: ['png'] },
        { name: 'All Files', extensions: ['*'] }
    ];

export interface FileInfoType {
    fileName: string;
    fileContent: string;
}

export const readImageFromLocal = (filePath: string): Buffer | null => {
    let image: Buffer | null = null;
    try {
        image = fs.readFileSync(filePath);
    } catch (e) {
        console.log(e);
    }
    return image;
};
