type RequestDescriptor<T> = {
    resolver: (value: T | PromiseLike<T>) => void;
    rejector: (reason: unknown) => void;
    task: () => T | Promise<T>;
};

export type PoolOptions = {
    concurrency: number;
    minGap: number;
};

export class RequestPool<T> {
    ongoingRequest: RequestDescriptor<T>[];
    pendingRequest: RequestDescriptor<T>[];
    options: PoolOptions;

    gapTimer: NodeJS.Timeout | null = null;

    stopped = false;

    constructor(options: Partial<PoolOptions> = {}) {
        this.ongoingRequest = [];
        this.pendingRequest = [];
        this.options = {
            concurrency: options.concurrency ?? 5,
            minGap: options.minGap ?? 1000,
        };
    }

    async tryRun(task: RequestDescriptor<T>) {
        this.ongoingRequest.push(task);
        try {
            this.gapTimer = setTimeout(() => {
                console.log('Min gap reached, starting a new task');
                this.gapTimer = null;
                this.tryStart();
            }, this.options.minGap);

            const result = await task.task();
            task.resolver(result);
        } catch (error) {
            task.rejector(error);
        } finally {
            this.ongoingRequest = this.ongoingRequest.filter(
                (req) => req !== task
            );
            this.tryStart();
        }
    }

    tryStart() {
        if (this.ongoingRequest.length >= this.options.concurrency) {
            return;
        }
        if (this.gapTimer) {
            return;
        }
        if (this.stopped) {
            return;
        }
        const nextTaskDesc = this.pendingRequest.shift();
        if (nextTaskDesc) {
            this.tryRun(nextTaskDesc);
        }
    }

    run(task: RequestDescriptor<T>['task']): Promise<T> {
        this.stopped = false;
        const promise = new Promise<T>((resolve, reject) => {
            const resolver = resolve;
            const rejector = reject;
            this.pendingRequest.push({
                resolver,
                rejector,
                task,
            });
        });
        this.tryStart();

        return promise;
    }

    clear() {
        this.stopped = true;
        for (const task of this.ongoingRequest) {
            task.rejector(new Error('RequestPool is stopped'));
        }
        this.pendingRequest = [];
        this.ongoingRequest = [];
        if (this.gapTimer) {
            clearTimeout(this.gapTimer);
        }
        this.gapTimer = null;
    }
}
