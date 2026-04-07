import { getModels } from '@/actions/models';
import PromptEdit from '@/app/prompt/PromptEdit';

const Page = async () => {
    const models = await getModels();
    return (
        <PromptEdit
            modelList={models?.success ? (models.data?.result ?? []) : []}
        />
    );
};
export default Page;
