import * as fs from 'fs';

export module FileSystem {
    export function readFile(path: string) {
        return new Promise<string>((resolve, reject) => {
            fs.readFile(path, (err, data) => {
                if (err)
                    reject(err);
                else
                    resolve(data.toString());
            });
        });
    }

    export function writeFile(path: string, data: string | NodeJS.ArrayBufferView) {
        return new Promise<void>((resolve, reject) => {
            fs.writeFile(path, data, err => err ? reject(err) : resolve());
        })
    }
}