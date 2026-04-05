'use server';

import { AnkiConnectResult } from '@/actions/deck';

export type SimpleNoteQueryResult = AnkiConnectResult<number[]>;

export type NoteDetail = {
    noteId: number;
    modelName: string;
    mod: number;
    cards: number[];
    tags: string[];
    fields: Record<
        string,
        {
            value: string;
            order: number;
        }
    >;
};

export type NoteDetailQueryResult = AnkiConnectResult<NoteDetail[]>;

export async function getNoteList(
    endpoint: string,
    deckName: string,
    pageNumber: number,
    pageSize: number
) {
    try {
        const body = await fetch(endpoint, {
            method: 'post',
            body: JSON.stringify({
                action: 'findNotes',
                version: 5,
                params: {
                    query: `"deck:${deckName}"`,
                },
            }),
        });
        const data = (await body.json()) as SimpleNoteQueryResult;

        const total = data.result.length;
        const start = pageNumber * pageSize;
        const end = start + pageSize;
        const nodeRange = data.result.slice(start, end);

        const detailBody = await fetch(endpoint, {
            method: 'post',
            body: JSON.stringify({
                action: 'notesInfo',
                version: 5,
                params: {
                    notes: nodeRange,
                },
            }),
        });
        const detailData = (await detailBody.json()) as NoteDetailQueryResult;

        return {
            data: {
                total,
                noteList: detailData.result,
            },
            success: true,
        };
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return {
            data: {
                total: 0,
                noteList: [],
            },
            success: false,
            error: errorMessage,
        };
    }
}

export async function updateNote(
    endpoint: string,
    noteId: number,
    fields: Record<string, string>
) {
    const body = await fetch(endpoint, {
        method: 'post',
        body: JSON.stringify({
            action: 'updateNoteFields',
            version: 5,
            params: {
                note: {
                    id: noteId,
                    fields: fields,
                },
            },
        }),
    });

    const data = (await body.json()) as AnkiConnectResult<unknown>;
    return data;
}

export async function createNote(
    endpoint: string,
    args: {
        deckName: string;
        modelName: string;
        tags: string[];
        audio?: {
            url: string;
            fileName: string;
            fields: string;
        };
        fields: Record<string, string>;
    }
) {
    const body = await fetch(endpoint, {
        method: 'post',
        body: JSON.stringify({
            action: 'addNote',
            version: 5,
            params: {
                note: {
                    deckName: args.deckName,
                    modelName: args.modelName,
                    fields: args.fields,
                    tags: args.tags,
                    audio: args.audio,
                },
            },
        }),
    });

    const data = (await body.json()) as AnkiConnectResult<unknown>;
    return data;
}

export async function batchCreateNote(
    endpoint: string,
    args: {
        deckName: string;
        modelName: string;
        notes: {
            tags: string[];
            audio?: {
                url: string;
                fileName: string;
                fields: string;
            };
            fields: Record<string, string>;
        }[];
    }
) {
    const requestBody = {
        action: 'addNotes',
        version: 5,
        params: {
            notes: args.notes.map((note) => ({
                deckName: args.deckName,
                modelName: args.modelName,
                fields: note.fields,
                tags: note.tags,
                audio: note.audio,
            })),
        },
    };

    const body = await fetch(endpoint, {
        method: 'post',
        body: JSON.stringify(requestBody),
    });

    const data = (await body.json()) as AnkiConnectResult<(number | null)[]>;
    return data;
}

export async function findIfExistInDeck({
    endpoint,
    deckName,
    searchField,
    word,
}: {
    endpoint: string;
    deckName: string;
    searchField: string;
    word: string;
}) {
    try {
        const query = `"deck:${deckName}" ${searchField}:${word}`;
        const body = await fetch(endpoint, {
            method: 'post',
            body: JSON.stringify({
                action: 'findNotes',
                version: 5,
                params: {
                    query,
                },
            }),
        });
        const data = (await body.json()) as SimpleNoteQueryResult;

        if (data.error) {
            return {
                success: false,
                error: data.error,
            };
        }

        if (data.result.length > 0) {
            return {
                success: true,
                data: {
                    exist: true,
                    noteId: data.result[0],
                },
            };
        }
        return {
            success: true,
            data: {
                exist: false,
                noteId: [],
            },
        };
    } catch (e) {
        return {
            success: false,
            data: null,
            error: e instanceof Error ? e.message : 'Unknown error',
        };
    }
}
