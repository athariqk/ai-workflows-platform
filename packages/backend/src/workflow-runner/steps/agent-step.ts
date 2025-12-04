import { prisma } from "@/lib/prisma";
import Step from "@/workflow-runner/steps/step";

export default class AgentStep extends Step {
    private agentId: string;

    constructor(agentId: string) {
        super();
        this.agentId = agentId;
    }

    async execute(input?: string): Promise<string> {
        const agent = await prisma.agent.findUnique({
            where: { id: this.agentId },
        });

        // TODO: Integrate with actual AI model APIs (Gemini, ChatGPT, Claude)
        // For now, return a mock response
        const response = `[Agent ${agent?.model || 'unknown'}] Processed input: "${input ? input : ''}"`;
        // Simulate async AI API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        return response;
    }
}
