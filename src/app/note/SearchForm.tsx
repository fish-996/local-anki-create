'use client';
import { Autocomplete, Box, Button, Grid, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useNoteContext } from '@/app/note/NoteContext';

const SearchForm = (props: { deckName: string; deckList: string[] }) => {
    const [deckList, setDeckList] = useState(props.deckList);
    const [prevDeckList, setPrevDeckList] = useState(props.deckList);
    const [deckName, setDeckName] = useState(props.deckName ?? '');
    const { showCreateModal, showBatchCreateModal } = useNoteContext();

    if (props.deckList !== prevDeckList) {
        setDeckList(props.deckList);
        setPrevDeckList(props.deckList);
        if (!props.deckList.includes(deckName)) {
            setDeckName('');
        }
    }

    const router = useRouter();

    const searchParams = useSearchParams();
    const pathname = usePathname();

    function handleSearch() {
        const params = new URLSearchParams(searchParams.toString());
        params.set('deckName', deckName);
        params.set('pageNumber', '0');
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }

    return (
        <Box alignContent="center" display="flex" flexDirection="row" gap={2}>
            <Autocomplete
                className="min-w-100"
                options={deckList}
                renderInput={(params) => (
                    <TextField {...params} label="Deck Name" />
                )}
                value={deckName}
                onChange={(e, newVal) => setDeckName(newVal ?? '')}
            />
            <Button type="submit" variant="contained" onClick={handleSearch}>
                Search
            </Button>
            {deckName && (
                <>
                    <Button
                        type="submit"
                        variant="contained"
                        onClick={showCreateModal}
                    >
                        Add New Note
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        onClick={showBatchCreateModal}
                    >
                        Batch Add Note
                    </Button>
                </>
            )}
        </Box>
    );
};

export default SearchForm;
