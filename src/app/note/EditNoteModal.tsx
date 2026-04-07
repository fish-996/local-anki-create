import {
    createNote,
    findIfExistInDeck,
    NoteDetail,
    updateNote,
} from '@/actions/notes';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    FormControlLabel,
    Grid,
    IconButton,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import {
    useEffect,
    useEffectEvent,
    useRef,
    useState,
    useTransition,
} from 'react';
import { getModelDetail, getModels } from '@/actions/models';
import {
    AutoAwesome,
    ExpandLess,
    ExpandMore,
    RefreshOutlined,
} from '@mui/icons-material';
import FieldInput from '@/app/note/FieldInput';
import clsx from 'clsx';
import {
    generateMultipleFields,
    generateSingleField,
} from '@/actions/generation';
import { usePromptContext } from '@/app/_publicContext/PromptContext';

export const NEW_NOTE_TAG = 'created_by_anki_note_editor';

const EditNoteModal = (props: {
    noteInfo: NoteDetail | null;
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
    const [formFields, setFormFields] = useState<
        {
            key: string;
            value: string;
            prompt: string;
            isWord?: boolean;
        }[]
    >([]);
    const [savePrompts, setSavePrompts] = useState(false);

    const [errorState, setErrorState] = useState<string | null>(null);

    function showError(message: string, duration: number = 3000) {
        setErrorState(message);
        setTimeout(() => {
            setErrorState(null);
        }, duration);
    }

    const isEditMode = props.noteInfo !== null;

    const { setFieldPrompt, getFieldPrompt } = usePromptContext();

    const updateModelFormFields = useEffectEvent(async (model: string) => {
        if (isEditMode) return;

        if (model === '') {
            setFormFields([]);
            return;
        }
        const fields = await getModelDetail(model);
        if (!fields.success) {
            showError('Failed to get model detail');
            return;
        }
        const newFormFields =
            fields.data?.result.map((c) => {
                const key = c;
                let value = '';
                let isWord = false;
                const originalFormField = formFields.find((f) => f.key === key);
                if (originalFormField) {
                    value = originalFormField.value;
                    isWord = originalFormField.isWord ?? false;
                }
                return {
                    key,
                    value,
                    prompt:
                        originalFormField?.prompt ??
                        getFieldPrompt(model, key) ??
                        '',
                    isWord,
                };
            }) ?? [];

        if (newFormFields.length > 0 && !newFormFields.some((c) => c.isWord)) {
            newFormFields[0].isWord = true;
        }

        setFormFields(newFormFields);
    });

    useEffect(() => {
        updateModelFormFields(model);
    }, [model]);

    const updateFormFields = useEffectEvent(() => {
        if (!isEditMode) {
            return;
        }
        const fields = Object.entries(props.noteInfo?.fields ?? {}).map(
            (c, index) => {
                const key = c[0];
                const value = c[1].value;
                return {
                    key,
                    value,
                    prompt: props.noteInfo?.modelName
                        ? (getFieldPrompt(props.noteInfo.modelName, key) ?? '')
                        : '',
                    isWord: index === 0,
                };
            }
        );
        setFormFields(fields);
    });

    useEffect(() => {
        if (props.visible) {
            updateFormFields();
            updateModelFormFields('');
            return;
        }
    }, [props.visible]);

    function changeFormField(index: number, value: string) {
        const newFields = [...formFields];
        newFields[index] = {
            ...newFields[index],
            value,
        };
        setFormFields(newFields);
    }

    function changeFormFieldPrompt(index: number, prompt: string) {
        const newFields = [...formFields];
        newFields[index] = {
            ...newFields[index],
            prompt,
        };
        setFormFields(newFields);
    }

    function toggleIsWord(index: number, isWord: boolean) {
        const newFields = [...formFields].map((f, i) => {
            if (i === index) {
                return {
                    ...f,
                    isWord,
                };
            }
            if (isWord && f.isWord) {
                return {
                    ...f,
                    isWord: false,
                };
            }
            return f;
        });
        if (newFields.length > 0 && !newFields.some((c) => c.isWord)) {
            newFields[0].isWord = true;
        }
        setFormFields(newFields);
    }

    async function refreshModelList() {
        try {
            const response = await getModels();
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

    const generationSignal = useRef<AbortController | null>(null);

    function createCancelablePromise<T>(
        cb: () => Promise<T>,
        signal: AbortController
    ) {
        return new Promise<T>((resolve, reject) => {
            signal.signal.addEventListener(
                'abort',
                () => {
                    reject(new Error('Aborted'));
                },
                {
                    once: true,
                }
            );
            cb().then(resolve).catch(reject);
        });
    }

    const [generationOnGoing, startGeneration] = useTransition();

    async function handleFullGeneration() {
        if (!formFields.length) {
            showError('No fields to generate');
            return;
        }
        const wordField = formFields.find((f) => f.isWord);
        if (!wordField?.value) {
            showError('No word fields to generate');
            return;
        }

        startGeneration(async () => {
            const otherFields = formFields
                .filter((f) => !f.isWord)
                .filter((f) => f.prompt);
            const requestPayload = otherFields.map((f) => ({
                fieldName: f.key,
                prompt: f.prompt,
            }));
            if (generationSignal.current) {
                generationSignal.current.abort();
            }
            generationSignal.current = new AbortController();
            try {
                const result = await createCancelablePromise(
                    () =>
                        generateMultipleFields({
                            word: wordField.value,
                            fields: requestPayload,
                        }),
                    generationSignal.current
                );
                if (!result.success) {
                    showError(result.error ?? 'Failed to generate');
                    return;
                }
                const newFormFields = formFields.map((f) => {
                    if (result.data[f.key]) {
                        return {
                            ...f,
                            value: result.data[f.key],
                        };
                    }
                    return f;
                });
                setFormFields(newFormFields);
            } catch (error) {
                console.warn('Generation aborted');
            }
        });
    }

    async function handleGenerateSingleField(args: { fieldKey: string }) {
        const { fieldKey } = args;
        const field = formFields.find((f) => f.key === fieldKey);
        const fieldIndex = formFields.findIndex((f) => f.key === fieldKey);
        if (!field) {
            showError(`Field ${fieldKey} not found`);
            return;
        }
        if (field.isWord) {
            showError('Cannot generate for word field');
            return;
        }
        const wordField = formFields.find((c) => c.isWord);
        if (!wordField?.value) {
            showError('No word field found');
            return;
        }

        startGeneration(async () => {
            const prompt = field.prompt;

            if (generationSignal.current) {
                generationSignal.current.abort();
            }
            generationSignal.current = new AbortController();
            try {
                const answer = await createCancelablePromise(
                    () =>
                        generateSingleField({
                            word: wordField.value,
                            prompt,
                            fieldName: fieldKey,
                        }),
                    generationSignal.current
                );
                if (!answer.success) {
                    showError(answer.error ?? 'Failed to generate');
                    return;
                }
                changeFormField(fieldIndex, answer.data);
            } catch (e) {
                console.warn('Generation aborted');
            }
        });
    }

    function getFormContent() {
        if (!formFields.length) {
            return null;
        }
        return formFields.map((field, index) => (
            <Grid container key={field.key} alignItems="stretch">
                <Grid size={2} className="h-14">
                    <Typography className="h-full flex items-center">
                        {field.key}
                    </Typography>
                </Grid>
                <Grid size={2} className="h-14 flex items-center">
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={field.isWord}
                                onChange={(e) =>
                                    toggleIsWord(index, e.target.checked)
                                }
                            />
                        }
                        label="use as word"
                    ></FormControlLabel>
                </Grid>
                <Grid size={8} className="flex flex-wrap items-center">
                    <FieldInput
                        fieldKey={field.key}
                        value={field.value}
                        prompt={field.prompt}
                        disableGeneration={
                            generationOnGoing ||
                            field.isWord ||
                            field.prompt.length === 0
                        }
                        onChange={(value) => changeFormField(index, value)}
                        onGenerate={() =>
                            handleGenerateSingleField({ fieldKey: field.key })
                        }
                        onPromptChange={(value) =>
                            changeFormFieldPrompt(index, value)
                        }
                    />
                </Grid>
            </Grid>
        ));
    }

    const actualModel = isEditMode ? props.noteInfo?.modelName : model;

    function savePromptsToStorage() {
        if (!actualModel) return;
        for (const field of formFields) {
            if (field.prompt) {
                setFieldPrompt(actualModel, field.key, field.prompt);
            }
        }
    }

    async function handleSubmit() {
        console.log('submit', formFields);
        const updateFields: Record<string, string> = {};

        formFields.forEach((field) => {
            updateFields[field.key] = field.value;
        });

        if (!props.noteInfo?.noteId) {
            if (!model) {
                showError('Please select a model', 3000);
                return;
            }
            const wordField = formFields.find((f) => f.isWord);
            if (!wordField?.value) {
                showError('No word field found', 3000);
                return;
            }

            const wordExisted = await findIfExistInDeck({
                deckName: props.deckName,
                searchField: wordField.key,
                word: wordField.value,
            });

            if (wordExisted.success && wordExisted.data?.exist) {
                showError(`Word ${wordField.value} already exists`);
                return;
            }

            const result = await createNote({
                deckName: props.deckName,
                fields: updateFields,
                tags: [NEW_NOTE_TAG],
                modelName: model,
            });

            if (result.error) {
                showError(result.error, 3000);
                return;
            }
            props.onSave();
            closeModal();
            return;
        }

        try {
            const result = await updateNote(
                props.noteInfo.noteId,
                updateFields
            );
            if (result.error) {
                showError(result.error, 3000);
                return;
            }
            if (savePrompts) {
                savePromptsToStorage();
            }

            props.onSave();
            closeModal();
        } catch (e) {
            showError(
                `Something went wrong ${e instanceof Error ? e.message : 'unknown'}`,
                3000
            );
            return;
        }
    }

    function closeModal() {
        if (generationSignal.current) {
            generationSignal.current.abort();
            generationSignal.current = null;
        }
        props.onClose();
        setTimeout(() => {
            setFormFields([]);
            setModel('');
            setSavePrompts(false);
        }, 400);
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
                        {!isEditMode && (
                            <Grid container alignItems="center">
                                <Grid size={4}>Model Name</Grid>
                                <Grid size={8} className="flex">
                                    <Select
                                        className="flex-1"
                                        value={model}
                                        onChange={(e) =>
                                            setModel(e.target.value)
                                        }
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
                        )}
                        {getFormContent()}
                    </Stack>
                </Box>
                <Box
                    className={clsx(
                        'absolute bottom-0 left-0 right-0 h-full w-full flex items-center justify-center pointer-none bg-gray-100/50',
                        {
                            hidden: !generationOnGoing,
                        }
                    )}
                >
                    <CircularProgress />
                </Box>
            </DialogContent>
            <DialogActions>
                <FormControlLabel
                    control={
                        <Switch
                            checked={savePrompts}
                            onChange={() => setSavePrompts(!savePrompts)}
                        />
                    }
                    label="Save prompts"
                />
                <Button type="button" size="large" onClick={closeModal}>
                    Cancel
                </Button>
                <Button
                    type="button"
                    variant="contained"
                    size="large"
                    disabled={!formFields.length || generationOnGoing}
                    startIcon={<AutoAwesome />}
                    onClick={() => handleFullGeneration()}
                >
                    Generate
                </Button>
                <Button
                    type="submit"
                    size="large"
                    variant="contained"
                    disabled={!formFields.length || generationOnGoing}
                    onClick={handleSubmit}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditNoteModal;
