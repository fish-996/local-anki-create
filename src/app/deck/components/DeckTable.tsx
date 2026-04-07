import { getDeckList } from '@/actions/deck';
import {
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import { ArrowOutward, Delete } from '@mui/icons-material';
import { RefreshIcon } from '@/app/deck/components/RefreshIcon';
import { DeckOperation } from '@/app/deck/components/DeckOperation';

export const DeckTable = async () => {
    const deckData = await getDeckList();
    if (!deckData.success) {
        return (
            <div>
                Error fetching deck data {deckData.error}. Have you checked the
                anki server is running?
            </div>
        );
    }
    return (
        <TableContainer component={Paper} className="w-full">
            <RefreshIcon />
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell className="w-50">ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell className="w-50">Operation</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {deckData.data?.map((deck) => (
                        <TableRow key={deck.id}>
                            <TableCell className="w-200px">{deck.id}</TableCell>
                            <TableCell>{deck.name}</TableCell>
                            <TableCell>
                                <DeckOperation deckName={deck.name} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};
