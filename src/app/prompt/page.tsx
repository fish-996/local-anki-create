import { getModels } from '@/actions/models';
import PromptEdit from '@/app/prompt/PromptEdit';

const Page = async () => {
    const endpoint = process.env.ANKI_ENDPOINT!;
    const models = await getModels(endpoint);
    return (
        <PromptEdit
            endpoint={endpoint}
            modelList={models?.success ? (models.data?.result ?? []) : []}
        />
    );
};
export default Page;
