'use server';

import { AnkiConnectResult } from '@/actions/deck';

export async function getModels(endpoint: string) {
    try {
        const body = await fetch(endpoint, {
            method: 'post',
            body: JSON.stringify({ action: 'modelNames', version: 5 }),
        });
        const data = (await body.json()) as AnkiConnectResult<string[]>;

        return {
            data,
            success: true,
        };
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return {
            data: null,
            success: false,
            error: errorMessage,
        };
    }
}

export async function getModelDetail(endpoint: string, modelName: string) {
    try {
        const body = await fetch(endpoint, {
            method: 'post',
            body: JSON.stringify({
                action: 'modelFieldNames',
                version: 5,
                params: {
                    modelName: modelName,
                },
            }),
        });
        const data = (await body.json()) as AnkiConnectResult<string[]>;

        return {
            data,
            success: true,
        };
    } catch (e) {
        console.log(e);
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return {
            data: null,
            success: false,
            error: errorMessage,
        };
    }
}
