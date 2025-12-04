export default abstract class Step {
    abstract execute(input?: string): Promise<string>;
}