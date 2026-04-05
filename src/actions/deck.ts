export type DeckQueryResult = AnkiConnectResult<Record<string, string>>;

export type AnkiConnectResult<T> = {
    result: T;
    error: string | null;
};

export async function getDeckList(endpoint: string) {
    'use server';
    try {
        const body = await fetch(endpoint, {
            method: 'post',
            body: JSON.stringify({ action: 'deckNamesAndIds', version: 5 }),
        });
        const data = (await body.json()) as DeckQueryResult;

        const deckList: { name: string; id: string }[] = [];

        for (const [key, value] of Object.entries(data.result)) {
            deckList.push({ name: key, id: value });
        }

        return {
            data: deckList,
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
