import {
    Checkbox,
    FormControlLabel,
    IconButton,
    Paper,
    TextField,
} from '@mui/material';
import { AutoAwesome, ExpandLess, ExpandMore } from '@mui/icons-material';
import { useState } from 'react';
import clsx from 'clsx';

const FieldInput = (props: {
    fieldKey: string;
    value: string;
    prompt: string;
    disableGeneration: boolean;
    onChange: (value: string) => void;
    onPromptChange: (value: string) => void;
    onGenerate: () => void;
}) => {
    const [showDetail, setShowDetail] = useState(false);

    return (
        <>
            <TextField
                className="grow shrink-0"
                type="text"
                value={props.value}
                onChange={(e) => props.onChange(e.target.value)}
            />
            <IconButton
                onClick={() => setShowDetail(!showDetail)}
                className="h-10"
            >
                {showDetail ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
            <div
                className={clsx(
                    'w-12/13 grid transition-[grid-template-rows] duration-300 ease-in-out',
                    showDetail ? 'grid-rows-[1fr] mt-2' : 'grid-rows-[0fr] mt-0'
                )}
            >
                <Paper className="overflow-hidden">
                    <div className="p-4 flex flex-row flex-wrap gap-2 items-center justify-between">
                        <TextField
                            key="prompt"
                            className="w-8/9"
                            type="text"
                            multiline
                            maxRows={5}
                            value={props.prompt}
                            onChange={(e) =>
                                props.onPromptChange(e.target.value)
                            }
                        ></TextField>
                        <IconButton
                            className="w-10 h-10"
                            disabled={props.disableGeneration}
                            onClick={props.onGenerate}
                        >
                            <AutoAwesome />
                        </IconButton>
                        <TextField
                            className="w-full"
                            type="text"
                            multiline
                            maxRows={20}
                            value={props.value}
                            onChange={(e) => props.onChange(e.target.value)}
                        ></TextField>
                    </div>
                </Paper>
            </div>
        </>
    );
};

export default FieldInput;
