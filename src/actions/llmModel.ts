import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI({
    model: process.env.LLM_MODEL,
    apiKey: process.env.GOOGLE_API_KEY, // 传入您的凭据
    configuration: {
        baseURL: process.env.GOOGLE_API_URL,
    },
    maxRetries: 0,
});

console.log(process.env.LLM_MODEL);

export { llm };
