import Step from "@/workflow-runner/steps/step.js";

export default class TextInputStep extends Step {
    private content: string;

    constructor(content: string) {
        super();
        this.content = content;
    }

    async execute(input?: string): Promise<string> {
        return input ? input : this.content;
    }
}
