interface ImportMetaEnv {
    readonly VITE_VERSION: string;

    readonly VITE_PROJECT_API: string;

    readonly VITE_GAODE_WEB_API: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}