'use server';

import { llm } from '@/actions/llmModel';
import { z, ZodObject } from 'zod';

async function generateWithSchema<T extends ZodObject>(
    schema: T,
    message: string
) {
    const model = llm.withStructuredOutput(schema, {
        method: 'functionCalling',
    });

    return (await model.invoke(message, {
        timeout: 30000,
    })) as z.infer<T>;
}

export async function getSimpleAnswer(message: string) {
    const schema = z.object({
        answer: z
            .string()
            .describe(
                'The answer to the question, put whatever you want to say in this'
            ),
    });

    return await generateWithSchema(schema, message);
}

export async function generateSingleField<T extends string>(args: {
    word: string;
    prompt: string;
    fieldName: T;
}): Promise<
    { success: true; data: string } | { success: false; error: string }
> {
    const schema = z.object({
        [args.fieldName]: z.string().describe(args.prompt),
    });

    try {
        const result = (await generateWithSchema(
            schema,
            `Please generate a ${args.fieldName} for the word ${args.word}. It could be any language but usually English or German`
        )) as { [T: string]: string };
        const answer = result[args.fieldName];
        return {
            success: true,
            data: answer,
        };
    } catch (e) {
        return {
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error',
        };
    }
}

export async function generateMultipleFields(args: {
    word: string;
    fields: {
        fieldName: string;
        prompt: string;
    }[];
}): Promise<
    | { success: true; data: Record<string, string> }
    | { success: false; error: string }
> {
    console.log(`Generation started: ${performance.now()}`);
    // 1. 动态构建 Zod Schema 的 Shape
    const schemaShape: Record<string, z.ZodString> = {};
    for (const field of args.fields) {
        schemaShape[field.fieldName] = z.string().describe(field.prompt);
    }

    // 2. 生成最终的 Zod Object Schema
    const schema = z.object(schemaShape);
    try {
        // 3. 修改 Prompt，使其适应多字段生成的语境
        const promptText = `Please generate the requested fields for the word "${args.word}". It could be any language but usually English or German.`;
        // 4. 调用 AI 生成函数
        const result = (await generateWithSchema(schema, promptText)) as Record<
            string,
            string
        >;
        // 5. 直接返回包含多个字段的完整的 Record 对象
        return {
            success: true,
            data: result,
        };
    } catch (e) {
        return {
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error',
        };
    }
}
