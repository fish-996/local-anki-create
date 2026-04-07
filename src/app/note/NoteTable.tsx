'use client';
import {
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TablePagination,
    TableRow,
} from '@mui/material';
import { getNoteList, NoteDetail } from '@/actions/notes';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Edit } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import EditNoteModal from '@/app/note/EditNoteModal';
import { useNoteContext } from '@/app/note/NoteContext';
import { getSimpleAnswer } from '@/actions/generation';
import BatchCreateModal from '@/app/note/BatchCreateModal';

const NoteTable = (props: {
    total: number;
    noteList: NoteDetail[];
    pageNumber: number;
    pageSize: number;
    deckName: string;
    modelList: string[];
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    function refreshPagination(newPageSize: number, newPageNumber: number) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('deckName', props.deckName);
        params.set('pageSize', newPageSize.toString());
        params.set('pageNumber', newPageNumber.toString());
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }

    const {
        showEditModal,
        editModalState,
        closeEditModal,
        batchCreateModalState,
        showBatchCreateModal,
        closeBatchCreateModal,
    } = useNoteContext();

    function getPreview(note: NoteDetail) {
        const fields = Object.entries(note.fields);
        if (fields.length === 0) {
            return '';
        }
        return fields[0][1].value;
    }

    function getNoteInfo(noteId: number): NoteDetail | null {
        return props.noteList.find((note) => note.noteId === noteId) ?? null;
    }

    return (
        <div>
            <div>Table of {props.total} notes</div>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Note ID</TableCell>
                        <TableCell>Model</TableCell>
                        <TableCell>Cards</TableCell>
                        <TableCell>Preview</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {props.noteList.map((note, index) => (
                        <TableRow key={note.noteId}>
                            <TableCell>{note.noteId}</TableCell>
                            <TableCell>{note.modelName}</TableCell>
                            <TableCell>{note.cards.length}</TableCell>
                            <TableCell>{getPreview(note)}</TableCell>
                            <TableCell>
                                <IconButton
                                    onClick={() =>
                                        showEditModal(
                                            note.noteId,
                                            getNoteInfo(note.noteId)
                                        )
                                    }
                                >
                                    <Edit />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <TablePagination
                count={props.total}
                onPageChange={(_e, pageNumber) => {
                    refreshPagination(props.pageSize, pageNumber);
                }}
                onRowsPerPageChange={(e) => {
                    refreshPagination(parseInt(e.target.value), 0);
                }}
                page={props.pageNumber}
                rowsPerPage={props.pageSize}
                component="div"
            />
            <EditNoteModal
                visible={editModalState.visible}
                noteInfo={editModalState.noteInfo}
                modelList={props.modelList}
                deckName={props.deckName}
                onClose={() => closeEditModal()}
                onSave={() => {
                    router.refresh();
                }}
            />
            <BatchCreateModal
                visible={batchCreateModalState.visible}
                modelList={props.modelList}
                deckName={props.deckName}
                onClose={() => closeBatchCreateModal()}
                onSave={() => {
                    router.refresh();
                }}
            />
        </div>
    );
};
export default NoteTable;
