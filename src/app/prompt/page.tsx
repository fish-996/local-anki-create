import { getModels } from '@/actions/models';
import PromptEdit from '@/app/prompt/PromptEdit';

export const dynamic = 'force-dynamic';

const Page = async () => {
    const models = await getModels();
    if(models.error) {
        return <div>Error fetching models</div>
    }
    return (
        <PromptEdit
            modelList={models?.success ? (models.data?.result ?? []) : []}
        />
    );
};
export default Page;
