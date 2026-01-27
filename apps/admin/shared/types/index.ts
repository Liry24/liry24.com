export interface ConsoleLog {
    createdAt: Date
    message: string
    type?: 'log' | 'warn' | 'error'
}
