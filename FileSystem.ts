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
}