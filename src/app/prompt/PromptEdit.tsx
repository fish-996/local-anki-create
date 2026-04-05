'use client';
import { usePromptContext } from '@/app/_publicContext/PromptContext';
import { getModelDetail, getModels } from '@/actions/models';
import { useEffect, useEffectEvent, useState } from 'react';
import { Autocomplete, Box, Button, Stack, TextField } from '@mui/material';

const PromptEdit = (props: { modelList: string[]; endpoint: string }) => {
    const { setFieldPrompt, getFieldPrompt } = usePromptContext();

    const [selectedModel, setSelectedModel] = useState<string | null>('');

    const [modelDetail, setModelDetail] = useState<
        {
            prompt: string;
            key: string;
        }[]
    >([]);

    async function initModelFields(modelName: string) {
        const modelDetail = await getModelDetail(props.endpoint, modelName);
        if (modelDetail.success && modelDetail.data?.result) {
            return modelDetail.data.result.map((item) => ({
                prompt: getFieldPrompt(modelName, item) ?? '',
                key: item,
            }));
        }
        return [];
    }

    const changeModelInitEvent = useEffectEvent(async (modelName: string) => {
        if (!modelName) return;
        const modelDetail = await initModelFields(modelName);
        setModelDetail(modelDetail);
    });

    useEffect(() => {
        if (!selectedModel) return;
        changeModelInitEvent(selectedModel ?? '');
    }, [selectedModel, props.endpoint]);

    function updateFormPrompt(key: string, prompt: string) {
        const newDetail = modelDetail.map((item) => {
            if (item.key === key) {
                return { ...item, prompt };
            }
            return item;
        });
        setModelDetail(newDetail);
    }

    async function savePromptToStorage() {
        for (const item of modelDetail) {
            if (item.prompt && item.key) {
                setFieldPrompt(selectedModel ?? '', item.key, item.prompt);
            }
        }

    }

    return (
        <div>
            <Stack gap={2}>
                <Box className="flex flex-row gap-2">
                    <Autocomplete
                        className="min-w-200"
                        value={selectedModel}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Model"
                                className="min-w-200"
                            />
                        )}
                        onChange={(e, value) => setSelectedModel(value)}
                        options={props.modelList}
                    />
                    <Button
                        variant="contained"
                        onClick={() => {
                            savePromptToStorage();
                        }}
                    >
                        Save
                    </Button>
                </Box>
                {modelDetail.map((item) => (
                    <TextField
                        fullWidth
                        key={item.key}
                        label={item.key}
                        value={item.prompt}
                        onChange={(e) =>
                            updateFormPrompt(item.key, e.target.value)
                        }
                    ></TextField>
                ))}
            </Stack>
        </div>
    );
};
export default PromptEdit;
