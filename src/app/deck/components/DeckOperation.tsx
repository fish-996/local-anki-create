'use client';
import { IconButton } from '@mui/material';
import { ArrowOutward, Delete } from '@mui/icons-material';
import { UiLink } from '@/components/UiLink';

export const DeckOperation = (props: { deckName: string }) => {
    function handleDelete() {
        console.log('delete deck', props.deckName);
    }

    return (
        <>
            <IconButton onClick={handleDelete}>
                <Delete />
            </IconButton>
            <IconButton
                component={UiLink}
                href={`/note?deckName=${props.deckName}`}
                underline="none"
            >
                <ArrowOutward />
            </IconButton>
        </>
    );
};
