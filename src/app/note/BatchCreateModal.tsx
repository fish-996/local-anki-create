import {
    batchCreateNote,
    findIfExistInDeck,
    NoteDetail,
} from '@/actions/notes';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    FormControlLabel,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
} from '@mui/material';
import {
    AutoAwesome,
    CheckOutlined,
    RefreshOutlined,
} from '@mui/icons-material';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { getModelDetail, getModels } from '@/actions/models';
import { RequestPool } from '@/app/note/RequestPool';
import { generateMultipleFields } from '@/actions/generation';
import { string } from 'zod';
import { usePromptContext } from '@/app/_publicContext/PromptContext';
import { NEW_NOTE_TAG } from '@/app/note/EditNoteModal';
type GenerationRequestResult = {
    success: boolean;
    error?: string;
    data?: Record<string, string | boolean>;
};

const BatchCreateModal = (props: {
    apiEndpoint: string;
    onClose: () => void;
    onSave: () => void;
    visible: boolean;
    modelList: string[];
    deckName: string;
}) => {
    const [modelList, setModelList] = useState(props.modelList);
    const [prevModelList, setPrevModelList] = useState(props.modelList);
    const [model, setModel] = useState('');
    if (props.modelList !== prevModelList) {
        setModelList(props.modelList);
        setPrevModelList(props.modelList);
        if (!props.modelList.includes(model)) {
            setModel('');
        }
    }

    const modelInfo = useRef<string[]>([]);

    useEffect(() => {
        if (!model) {
            modelInfo.current = [];
            return;
        }
        const getInfo = async () => {
            const response = await getModelDetail(props.apiEndpoint, model);
            if (!response.success) {
                return;
            }
            modelInfo.current = response.data?.result ?? [];
        };
        getInfo();
    }, [model, props.apiEndpoint]);

    const requestPool = useRef<RequestPool<GenerationRequestResult> | null>(
        null
    );

    const [errorState, setErrorState] = useState<string | null>(null);

    function showError(message: string, duration: number = 3000) {
        setErrorState(message);
        setTimeout(() => {
            setErrorState(null);
        }, duration);
    }

    async function refreshModelList() {
        try {
            const response = await getModels(props.apiEndpoint);
            if (!response.success) {
                showError('Failed to refresh models');
                return;
            }
            const newModelList = response.data?.result ?? [];
            setModelList(newModelList);
            if (!newModelList.includes(model)) {
                setModel('');
            }
        } catch (e) {
            showError(
                `Error refreshing models: ${e instanceof Error ? e.message : 'unknown'}`
            );
        }
    }

    function closeModal() {
        props.onClose();
        if (requestPool.current) {
            requestPool.current.clear();
        }
        setTimeout(() => {
            setRequestWordStr('');
            setWordGenerationList([]);
        }, 200);
    }

    const [requestWordStr, setRequestWordStr] = useState('');
    const [wordGenerationList, setWordGenerationList] = useState<
        {
            word: string;
            id: string;
            status: 'pending' | 'success' | 'failed' | 'cancelled' | 'init';
            selected: boolean;
            generationResult?: Record<string, string> | null;
            generationKey?: string;
        }[]
    >([]);

    function handleSetWordList() {
        const wordList = requestWordStr
            .split(',')
            .filter((w) => w.trim() !== '')
            .map((word) => word.trim());
        const newWordGenerationList = wordList.map((word) => {
            const existing = wordGenerationList.find(
                (item) => item.word === word
            );
            if (existing) {
                return existing;
            }
            return {
                word,
                id: crypto.randomUUID(),
                status: 'init' as const,
                selected: true,
            };
        });
        setWordGenerationList(newWordGenerationList);
    }

    const ifAnySelected = wordGenerationList.some((item) => item.selected);

    function selectAll() {
        const newWordGenerationList = wordGenerationList.map((item) => ({
            ...item,
            selected: !ifAnySelected,
        }));
        setWordGenerationList(newWordGenerationList);
    }

    function handleSelectOne(id: string) {
        const newWordGenerationList = wordGenerationList.map((item) => {
            if (item.id === id) {
                return {
                    ...item,
                    selected: !item.selected,
                };
            }
            return item;
        });
        setWordGenerationList(newWordGenerationList);
    }

    const generationContent = (
        <List>
            {wordGenerationList.map((item) => (
                <ListItem key={item.id}>
                    <ListItemButton
                        sx={{ flexGrow: 0 }}
                        onClick={() => handleSelectOne(item.id)}
                    >
                        <ListItemIcon>
                            <Checkbox checked={item.selected} />
                        </ListItemIcon>
                    </ListItemButton>
                    <ListItemText primary={item.word} />
                    <ListItemText
                        secondary={item.status}
                        sx={{ flexGrow: 0 }}
                        className="w-20"
                        onClick={() =>
                            console.log('Clicked on:', item.generationResult)
                        }
                    />
                </ListItem>
            ))}
        </List>
    );

    function updateGenerationStatus({
        id,
        status,
        result,
        setGenerationKey,
        validationGenerationKey,
    }: {
        id: string;
        status: 'pending' | 'success' | 'failed' | 'cancelled' | 'init';
        result?: unknown;
        setGenerationKey?: string;
        validationGenerationKey?: string;
    }) {
        setWordGenerationList((currList) => {
            const newWordGenerationList = currList.map((item) => {
                if (item.id === id) {
                    if (
                        validationGenerationKey &&
                        item.generationKey !== validationGenerationKey
                    ) {
                        return item;
                    }

                    const res = {
                        ...item,
                        status,
                    };
                    if (result) {
                        res.generationResult = result as Record<string, string>;
                    }
                    if (setGenerationKey && status === 'pending') {
                        res.generationKey = setGenerationKey;
                    }

                    return res;
                }
                return item;
            });
            return newWordGenerationList;
        });
    }

    const { getFieldPrompt } = usePromptContext();

    async function handleGeneration() {
        const selectedWords = wordGenerationList.filter(
            (item) => item.selected
        );
        if (selectedWords.length === 0) {
            return;
        }
        if (!requestPool.current) {
            requestPool.current = new RequestPool({
                minGap: 100,
                concurrency: 10,
            });
        }
        const modelWordField = modelInfo.current?.[0];
        if (!modelWordField) {
            showError('No model word field');
            return;
        }
        if (!requestPool.current) {
            return;
        }
        const ifAnyExists = await Promise.all(
            selectedWords.map(async (item) => {
                const result = await requestPool.current?.run(async () => {
                    const queryResult = await findIfExistInDeck({
                        endpoint: props.apiEndpoint,
                        deckName: props.deckName,
                        word: item.word,
                        searchField: modelWordField,
                    });
                    if (queryResult.success) {
                        return {
                            success: queryResult.success,
                            data: { exists: queryResult.data?.exist ?? false },
                        };
                    }
                    return {
                        success: false,
                    };
                });
                if (result && result.data?.exists === true) {
                    return {
                        exist: true,
                        word: item.word,
                    };
                }
                return {
                    exist: false,
                    word: item.word,
                };
            })
        );
        if (ifAnyExists.some((item) => item.exist)) {
            const existingWords = ifAnyExists
                .filter((item) => item.exist)
                .map((item) => item.word)
                .join(', ');
            showError(`Some words already exist in the deck: ${existingWords}`);
            return;
        }

        const thisBatchGenerationKey = crypto.randomUUID();

        const fieldList = modelInfo.current.map((field) => {
            return {
                fieldName: field,
                prompt: getFieldPrompt(model, field) ?? '',
            };
        });

        await Promise.all(
            selectedWords.map(async (item) => {
                updateGenerationStatus({
                    id: item.id,
                    status: 'pending',
                    result: null,
                    setGenerationKey: thisBatchGenerationKey,
                });
                try {
                    const generationResult = await requestPool.current?.run(
                        async () => {
                            try {
                                const response = await generateMultipleFields({
                                    word: item.word,
                                    fields: fieldList,
                                });
                                if (response.success) {
                                    return {
                                        success: response.success,
                                        data: response.data,
                                    };
                                }
                                return {
                                    success: false,
                                    error: response.error ?? 'unknown',
                                };
                            } catch (e) {
                                return {
                                    success: false,
                                    error:
                                        e instanceof Error
                                            ? e.message
                                            : 'unknown',
                                };
                            }
                        }
                    );
                    console.log(`Word ${item.word}: `, generationResult?.data);
                    if (generationResult?.success) {
                        updateGenerationStatus({
                            id: item.id,
                            status: 'success',
                            result: generationResult.data,
                            validationGenerationKey: thisBatchGenerationKey,
                        });
                    } else {
                        updateGenerationStatus({
                            id: item.id,
                            status: 'failed',
                            result: null,
                            validationGenerationKey: thisBatchGenerationKey,
                        });
                    }
                } catch (e) {
                    updateGenerationStatus({
                        id: item.id,
                        status: 'failed',
                        result: null,
                        validationGenerationKey: thisBatchGenerationKey,
                    });
                }
            })
        );
    }

    async function handleSave() {
        const targetWords = wordGenerationList.filter((item) => item.selected);
        if (targetWords.some((item) => item.status !== 'success')) {
            showError(
                `Some words are not generated yet: ${targetWords
                    .filter((item) => item.status !== 'success')
                    .map((item) => item.word)
                    .join(', ')}`
            );
            return;
        }
        const wordList = targetWords.map((item) => ({
            word: item.word,
            fields: item.generationResult,
        }));
        if (wordList.some((item) => !item.fields)) {
            showError(
                `Some words are not generated yet: ${wordList
                    .filter((item) => !item.fields)
                    .map((item) => item.word)
                    .join(', ')}`
            );
            return;
        }
        try {
            const response = await batchCreateNote(props.apiEndpoint, {
                deckName: props.deckName,
                modelName: model,
                notes: wordList.map((item) => ({
                    tags: [NEW_NOTE_TAG],
                    fields: item.fields!,
                })),
            });
            if (response.error) {
                showError(response.error);
                return;
            }
            if (response.result.some((result) => result === null)) {
                const errorWords = response.result
                    .filter((result) => result === null)
                    .map((item, index) => wordList[index].word)
                    .join(', ');

                showError(
                    `Some notes failed to create. Please try again later. ${errorWords}`
                );
                return;
            }
            closeModal();
            props.onSave();
        } catch (e) {
            showError(
                `Failed to create notes. Please try again later. ${e instanceof Error ? e.message : 'unknown'}`
            );
        }
    }

    return (
        <Dialog open={props.visible} onClose={closeModal} maxWidth="xl">
            <DialogContent className="min-w-200">
                {errorState && (
                    <Alert severity="error" className="mb-2">
                        {errorState}
                    </Alert>
                )}
                <Box className="">
                    <Stack component="div" spacing={2} className="min-w-200">
                        <Grid container alignItems="center">
                            <Grid size={4}>Model Name</Grid>
                            <Grid size={8} className="flex">
                                <Select
                                    className="flex-1"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                >
                                    {modelList.map((model) => (
                                        <MenuItem value={model} key={model}>
                                            {model}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <IconButton onClick={refreshModelList}>
                                    <RefreshOutlined />
                                </IconButton>
                            </Grid>
                        </Grid>
                        <Grid container alignItems="center">
                            <Grid size={4}>Word</Grid>
                            <Grid size={8} className="flex">
                                <TextField
                                    multiline
                                    maxRows={10}
                                    label="Word to generate"
                                    placeholder="Seperate by ,"
                                    value={requestWordStr}
                                    onChange={(e) =>
                                        setRequestWordStr(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSetWordList();
                                        }
                                    }}
                                    className="flex-1"
                                />
                                <IconButton onClick={handleSetWordList}>
                                    <CheckOutlined />
                                </IconButton>
                            </Grid>
                        </Grid>
                        {wordGenerationList.length > 0 && generationContent}
                    </Stack>
                </Box>
            </DialogContent>
            <DialogActions>
                <Container className="flex justify-between w-full">
                    {wordGenerationList.length > 0 && (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={ifAnySelected}
                                    onChange={() => selectAll()}
                                ></Checkbox>
                            }
                            label="Select all"
                            className="min-w-50"
                        />
                    )}
                    <Container className="flex gap-2 justify-end">
                        <Button type="button" size="large" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="contained"
                            size="large"
                            startIcon={<AutoAwesome />}
                            onClick={handleGeneration}
                        >
                            Generate
                        </Button>
                        <Button
                            type="submit"
                            size="large"
                            variant="contained"
                            onClick={handleSave}
                        >
                            Save
                        </Button>
                    </Container>
                </Container>
            </DialogActions>
        </Dialog>
    );
};

export default BatchCreateModal;
