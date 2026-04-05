'use client';
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';

const PromptContext = createContext<{
    getFieldPrompt: (modelName: string, fieldName: string) => string | null;
    setFieldPrompt: (
        modelName: string,
        fieldName: string,
        prompt: string
    ) => void;
}>({
    getFieldPrompt: () => null,
    setFieldPrompt: () => {},
});

const STORAGE_KEY = 'PROMPT_CONTEXT';

function saveToStorage(data: Record<string, Record<string, string>>) {
    const target: Record<string, Record<string, string>> = {};
    Object.keys(data).forEach((key) => {
        const value = data[key];
        target[key] = value;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(target));
}

function parseFromStorage() {
    try {
        const promptStorage = localStorage.getItem(STORAGE_KEY);
        if (promptStorage) {
            const promptMap: Record<string, Record<string, string>> = {};
            const jsonData = JSON.parse(promptStorage) as Record<
                string,
                Record<string, string>
            >;

            Object.keys(jsonData).forEach((modelName) => {
                const fields = jsonData[modelName];
                promptMap[modelName] = { ...fields };
            });
            return promptMap;
        }
        return {};
    } catch (e) {
        console.error('Error parsing JSON:', e);
        return {};
    }
}

export const PromptContextProvider = (props: { children: ReactNode }) => {
    const [promptMap, setPromptMap] = useState<
        Record<string, Record<string, string>>
    >(() => {
        if (typeof window !== 'undefined') {
            return parseFromStorage();
        }
        return {};
    });

    useEffect(() => {
        saveToStorage(promptMap);
    }, [promptMap]);

    function getFieldPrompt(modelName: string, fieldName: string) {
        const modelFields = promptMap[modelName];
        return modelFields ? (modelFields[fieldName] ?? '') : '';
    }

    const setFieldPrompt = useCallback(
        (modelName: string, fieldName: string, prompt: string) => {
            if (!modelName) {
                return;
            }

            // 使用函数式更新，确保拿到最新的 state
            setPromptMap((prev) => {
                const newState = {
                    ...prev,
                    [modelName]: {
                        ...(prev[modelName] || {}),
                        [fieldName]: prompt,
                    },
                };
                return newState;
            });
        },
        []
    );

    const contextValue = {
        getFieldPrompt,
        setFieldPrompt,
        promptMap,
    };

    return (
        <PromptContext.Provider value={contextValue}>
            {props.children}
        </PromptContext.Provider>
    );
};

export const usePromptContext = () => useContext(PromptContext);
