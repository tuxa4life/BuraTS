import readline from 'readline'

export const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
})

export const logOutputs = (command, io, rooms) => {
    switch (command) {
        case 'clients':
            const sockets = Array.from(io.sockets.sockets.values())
            console.log(`Connected clients (${sockets.length}):`)
            sockets.forEach((s) => console.log(`  - ${s.id.slice(0, 6)}`))
            break

        case 'rooms':
            console.log('Rooms object:', rooms)
            break

        case 'help':
            console.log('Available commands:')
            console.log('  clients  - List connected clients')
            console.log('  rooms    - Show rooms object')
            console.log('  roomID    - Show specific room object')
            console.log('  clear    - Clear console')
            console.log('  help     - Show this help message')
            console.log('  exit     - Shutdown server')
            break

        case 'clear':
            console.clear()
            break

        case 'exit':
            console.log('Shutting down server...')
            process.exit(0)
            break

         default:
            if (rooms[command]) {
                console.log(`Room "${command}":`, rooms[command])
            } else if (command.trim()) {
                console.log(`Unknown command: "${command}". Type "help" for available commands.`)
            }
    }
}
