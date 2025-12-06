import Step from "@/workflow-runner/steps/step.js";

export default class TextInputStep extends Step {
  private content: string;

  constructor(content: string) {
    super("text_input");
    this.content = content;
  }

  initialize(): Promise<void> {
    // do nothing
    return Promise.resolve();
  }

  async execute(input?: string): Promise<string> {
    return input ? input : this.content;
  }
}
