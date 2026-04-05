'use client';

import { createContext, ReactNode, useContext, useState } from 'react';
import { NoteDetail } from '@/actions/notes';

type NoteContextType = {
    editModalState: {
        visible: boolean;
        noteId: number | null;
        noteInfo: NoteDetail | null;
    };
    batchCreateModalState: {
        visible: boolean;
    };
    showEditModal: (noteId: number, noteInfo: NoteDetail | null) => void;
    showCreateModal: () => void;
    closeEditModal: () => void;
    showBatchCreateModal: () => void;
    closeBatchCreateModal: () => void;
};

const NoteContext = createContext<NoteContextType>({
    editModalState: {
        visible: false,
        noteId: null,
        noteInfo: null,
    },
    batchCreateModalState: {
        visible: false,
    },
    showEditModal: () => {},
    showCreateModal: () => {},
    closeEditModal: () => {},
    showBatchCreateModal: () => {},
    closeBatchCreateModal: () => {},
});

export function NoteContextProvider({ children }: { children: ReactNode }) {
    const [editModalState, setEditModalState] = useState<{
        visible: boolean;
        noteId: number | null;
        noteInfo: NoteDetail | null;
    }>({
        visible: false,
        noteId: null,
        noteInfo: null,
    });

    function showEditModal(noteId: number, noteInfo: NoteDetail | null) {
        setEditModalState({
            visible: true,
            noteId,
            noteInfo,
        });
    }

    function showCreateModal() {
        setEditModalState({
            visible: true,
            noteId: null,
            noteInfo: null,
        });
    }

    function closeEditModal() {
        setEditModalState({
            visible: false,
            noteId: null,
            noteInfo: null,
        });
    }

    const [batchCreateModalState, setBatchCreateModalState] = useState<{
        visible: boolean;
    }>({
        visible: false,
    });

    function showBatchCreateModal() {
        setBatchCreateModalState({
            visible: true,
        });
    }

    function closeBatchCreateModal() {
        setBatchCreateModalState({
            visible: false,
        });
    }

    const contextValue = {
        editModalState,
        showEditModal,
        showCreateModal,
        closeEditModal,
        showBatchCreateModal,
        closeBatchCreateModal,
        batchCreateModalState,
    };

    return (
        <NoteContext.Provider value={contextValue}>
            {children}
        </NoteContext.Provider>
    );
}

export function useNoteContext() {
    return useContext(NoteContext);
}
