import * as fs from 'fs';
import * as path from 'path';

export const readConfigs = async (
    directory: string,
): Promise<Array<any>> => {
    const rs: Array<any> = [];

    if (!fs.existsSync(directory)) {
        console.warn(`Directory does not exist: ${directory}`);
        return rs;
    }

    const files = await fs.promises.readdir(directory);

    for (const file of files) {
        if (path.extname(file).toLowerCase() === '.json') {
            try {
                const filePath = path.join(directory, file);
                const content = await fs.promises.readFile(filePath, 'utf-8');
                let config = JSON.parse(content);
                if (config.result)
                    config = config.result;

                delete config.id;
                if (config.traffic)
                    delete config.conditions;

                if (!config.name) {
                    throw new Error('Missing "name" property: ' + file);
                }

                rs.push(config);
            } catch (error) {
                console.error(`Error reading or parsing JSON file ${file}:`, error);
            }
        }
    }

    return rs;
};