import SearchForm from '@/app/note/SearchForm';
import { getNoteList } from '@/actions/notes';
import NoteTable from './NoteTable';
import { getDeckList } from '@/actions/deck';
import { NoteContextProvider } from '@/app/note/NoteContext';
import { getModels } from '@/actions/models';

const page = async (props: {
    searchParams: Promise<{
        deckName: string;
        pageNumber: string;
        pageSize: string;
    }>;
}) => {
    const searchParams = await props.searchParams;

    const deckName = searchParams.deckName ?? '';
    const pageSize = parseInt(searchParams.pageSize ?? '10') || 10;
    const pageNumber = parseInt(searchParams.pageNumber ?? '0') || 0;

    let nodeQueryResult: Awaited<ReturnType<typeof getNoteList>> | null = null;
    if (deckName) {
        nodeQueryResult = await getNoteList(
            process.env.ANKI_ENDPOINT!,
            deckName,
            pageNumber,
            pageSize
        );
    }

    const deckQueryResult = await getDeckList(process.env.ANKI_ENDPOINT!);
    const deckList = deckQueryResult?.data?.map((deck) => deck.name) ?? [];

    let modelList: string[];
    try {
        modelList =
            (await getModels(process.env.ANKI_ENDPOINT!)).data?.result ?? [];
    } catch (e) {
        modelList = [];
    }

    return (
        <div>
            <NoteContextProvider>
                <div>note for {deckName}</div>
                <SearchForm deckName={deckName} deckList={deckList} />
                {nodeQueryResult?.success ? (
                    <NoteTable
                        total={nodeQueryResult.data.total}
                        noteList={nodeQueryResult.data.noteList}
                        pageNumber={pageNumber}
                        pageSize={pageSize}
                        deckName={deckName}
                        modelList={modelList}
                    />
                ) : (
                    <div>
                        {nodeQueryResult
                            ? `error :${nodeQueryResult.error}`
                            : ''}
                    </div>
                )}
            </NoteContextProvider>
        </div>
    );
};
export default page;
