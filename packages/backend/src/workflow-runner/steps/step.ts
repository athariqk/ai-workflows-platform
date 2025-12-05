export default abstract class Step {
    name: string;

    constructor(name?: string) {
        this.name = name ?? "unnamed_step";
    }

    // todo: figure out what to pass to this method (e.g. some kind of build context??)
    abstract initialize(): Promise<void>;

    abstract execute(input?: string): Promise<string>;
}

export type StepType =
    'agent' |
    'text_input';
