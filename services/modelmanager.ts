import RNFS from 'react-native-fs';

const MODEL_VERSION = '1.0.0';
const MODEL_PATH = RNFS.DocumentDirectoryPath + '/model.gguf';
const VERSION_PATH = RNFS.DocumentDirectoryPath + '/model_version.txt';

export const ensureModel = async (): Promise<string> => {
    const versionExists = await RNFS.exists(VERSION_PATH);
    if (versionExists) {
        const installedVersion = await RNFS.readFile(VERSION_PATH, 'utf8');
        if (installedVersion === MODEL_VERSION) {
            console.log('Model already installed, version:', MODEL_VERSION);
            return MODEL_PATH;
        }
        console.log('Model version mismatch, updating...');
        await RNFS.unlink(MODEL_PATH);
        await RNFS.unlink(VERSION_PATH);
    }

    console.log('Installing model...');
    await RNFS.copyFileAssets('model.gguf', MODEL_PATH);
    await RNFS.writeFile(VERSION_PATH, MODEL_VERSION, 'utf8');
    console.log('Model installed successfully');
    return MODEL_PATH;
};