// All user-facing client strings live here, keyed identically across languages.
// `en` is the source of truth: its keys define TranslationKey, and every other
// language is typed as Record<TranslationKey, string> so a missing or misspelt
// key is a compile error rather than a silent English fallback at runtime.
//
// Interpolation: put {placeholders} in a string and pass matching params to t(),
// e.g. t('lobby.teamHint', { count: 4 }). Server-generated messages (the socket
// `message`/`game-over` events) are NOT translated here — they arrive as prose
// from the server.

export type Lang = 'en' | 'ka'

export const LANGUAGES: { code: Lang; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'ka', label: 'ქარ' },
]

const en = {
    // App / connection
    'app.connecting.title': 'Connecting to the server…',
    'app.connecting.message': 'The server may be waking up — the first connection can take a minute or two. Hang tight.',
    'app.down.title': "Can't reach the server",
    'app.down.message': "The server appears to be down. Refresh the page to try again — if that doesn't help, come back a bit later.",
    'app.down.action': 'Refresh page',

    // Login
    'login.welcome': 'Welcome!',
    'login.subtitle': 'Sign in to continue to your account',
    'login.error': 'Cannot login',

    // Common
    'common.loading': 'Loading...',
    'common.backToHome': 'Back to home',
    'common.player': 'player',
    'common.players': 'players',

    // Home
    'home.logOut': 'Log Out',
    'home.createNewRoom': 'Create New Room',
    'home.roomIdPlaceholder': 'Enter room ID...',
    'home.createRoom': 'Create Room',
    'home.yourGames': 'Your Games ({count})',
    'home.inProgress': 'In progress',
    'home.inLobby': 'In lobby',
    'home.rejoin': 'Rejoin',
    'home.availableRooms': 'Available Rooms ({count})',
    'home.joinRoom': 'Join Room',
    'home.noRooms': 'No rooms available. Create one to get started!',

    // Lobby
    'lobby.joining.title': 'Joining room…',
    'lobby.joining.message': 'Pulling up a chair at the table.',
    'lobby.notFound.title': 'Room not found',
    'lobby.notFound.message': 'This room may have been closed, or the link is no longer valid.',
    'lobby.cannotCopy': 'cannot copy',
    'lobby.host': 'Host',
    'lobby.emptySlot': 'Empty slot',
    'lobby.joinTeam': 'Join {team}',
    'lobby.title': 'Game Lobby',
    'lobby.subtitle': 'Pick a side and wait for players',
    'lobby.roomId': 'Room ID',
    'lobby.copied': 'Copied!',
    'lobby.copy': 'Copy',
    'lobby.team1': 'Team 1',
    'lobby.team2': 'Team 2',
    'lobby.teamHint': 'Teams must be 2 vs 2 to start ({count} / 4 players)',
    'lobby.startGame': 'Start Game',
    'lobby.leaveRoom': 'Leave Room',

    // Game
    'game.over': 'Game over',
    'game.rematch': 'Rematch',
    'game.joining.title': 'Joining game…',
    'game.joining.message': 'Getting you back to the table.',
    'game.notFound.title': 'Game not found',
    'game.notFound.message': 'This game may have already ended, or the link is no longer valid.',
    'game.play': 'PLAY',
    'game.daviOffered': '{from} offered {word} to {to}',
    'game.accept': 'Accept',
    'game.decline': 'Decline',
    'game.waitingResponse': 'Waiting for {name} response…',
    'game.leaveTitle': 'Leave the game?',
    'game.stepAway': 'Step away',
    'game.stepAwayDesc': 'keeps your seat — the game pauses and you can rejoin from the menu within the reconnect window.',
    'game.quit': 'Quit',
    'game.quitDesc': 'ends the game for everyone right away.',
    'game.quitGame': 'Quit game',
    'game.cancel': 'Cancel',
    'game.paused': 'Game paused',
    'game.waitingReconnect': 'Waiting for {names} to reconnect…',
    'game.aPlayer': 'a player',
    'game.pauseNote': "The game will end and everyone returns to the main page if they don't return in time.",
    'game.points': 'Points',

    // Chat
    'chat.title': 'Chat',
    'chat.open': 'Open chat',
    'chat.close': 'Close chat',
    'chat.enterFullscreen': 'Enter fullscreen',
    'chat.exitFullscreen': 'Exit fullscreen',
    'chat.send': 'Send message',
    'chat.empty': 'No messages yet. Say hello 👋',
    'chat.placeholder': 'Type a message…',

    // Toast (transient validation errors)
    'toast.signInRequired': 'You must be signed in',
    'toast.sameCardCount': 'You must play the same number of cards',
    'toast.sameSuit': 'You must play cards of the same suit',
}

export type TranslationKey = keyof typeof en

const ka: Record<TranslationKey, string> = {
    // App / connection
    'app.connecting.title': 'სერვერთან დაკავშირება…',
    'app.connecting.message': 'სერვერი შესაძლოა იღვიძებს — პირველი დაკავშირება შეიძლება ერთ-ორ წუთს გასტანოს. მოითმინეთ.',
    'app.down.title': 'სერვერთან დაკავშირება ვერ ხერხდება',
    'app.down.message': 'სერვერი როგორც ჩანს გათიშულია. ხელახლა საცდელად განაახლეთ გვერდი — თუ ეს არ დაეხმარა, ცოტა ხანში დაბრუნდით.',
    'app.down.action': 'გვერდის განახლება',

    // Login
    'login.welcome': 'მოგესალმებით!',
    'login.subtitle': 'გასაგრძელებლად შედით თქვენს ანგარიშზე',
    'login.error': 'შესვლა ვერ მოხერხდა',

    // Common
    'common.loading': 'იტვირთება...',
    'common.backToHome': 'მთავარ გვერდზე',
    'common.player': 'მოთამაშე',
    'common.players': 'მოთამაშეები',

    // Home
    'home.logOut': 'გასვლა',
    'home.createNewRoom': 'ახალი ოთახის შექმნა',
    'home.roomIdPlaceholder': 'შეიყვანეთ ოთახის ID...',
    'home.createRoom': 'ოთახის შექმნა',
    'home.yourGames': 'თქვენი თამაშები ({count})',
    'home.inProgress': 'მიმდინარეობს',
    'home.inLobby': 'ლობიში',
    'home.rejoin': 'დაბრუნება',
    'home.availableRooms': 'ხელმისაწვდომი ოთახები ({count})',
    'home.joinRoom': 'შესვლა',
    'home.noRooms': 'ხელმისაწვდომი ოთახები არ არის. დასაწყებად შექმენით ერთი!',

    // Lobby
    'lobby.joining.title': 'ოთახში შესვლა…',
    'lobby.joining.message': 'მაგიდასთან ადგილს გიმზადებთ.',
    'lobby.notFound.title': 'ოთახი ვერ მოიძებნა',
    'lobby.notFound.message': 'ეს ოთახი შესაძლოა დაიხურა, ან ბმული აღარ მოქმედებს.',
    'lobby.cannotCopy': 'კოპირება ვერ მოხერხდა',
    'lobby.host': 'მასპინძელი',
    'lobby.emptySlot': 'ცარიელი ადგილი',
    'lobby.joinTeam': '{team}-ში შესვლა',
    'lobby.title': 'თამაშის ლობი',
    'lobby.subtitle': 'აირჩიეთ მხარე და დაელოდეთ მოთამაშეებს',
    'lobby.roomId': 'ოთახის ID',
    'lobby.copied': 'დაკოპირდა!',
    'lobby.copy': 'კოპირება',
    'lobby.team1': 'გუნდი 1',
    'lobby.team2': 'გუნდი 2',
    'lobby.teamHint': 'დასაწყებად გუნდები 2-ზე-2 უნდა იყოს ({count} / 4 მოთამაშე)',
    'lobby.startGame': 'თამაშის დაწყება',
    'lobby.leaveRoom': 'ოთახიდან გასვლა',

    // Game
    'game.over': 'თამაში დასრულდა',
    'game.rematch': 'რევანში',
    'game.joining.title': 'თამაშში შესვლა…',
    'game.joining.message': 'მაგიდასთან გაბრუნებთ.',
    'game.notFound.title': 'თამაში ვერ მოიძებნა',
    'game.notFound.message': 'ეს თამაში შესაძლოა უკვე დასრულდა, ან ბმული აღარ მოქმედებს.',
    'game.play': 'დადება',
    'game.daviOffered': '{from}-მა შესთავაზა {word} {to}-ს',
    'game.accept': 'დათანხმება',
    'game.decline': 'უარი',
    'game.waitingResponse': '{name}-ის პასუხს ელოდება…',
    'game.leaveTitle': 'თამაშის დატოვება?',
    'game.stepAway': 'განზე გადგომა',
    'game.stepAwayDesc': 'ინარჩუნებს თქვენს ადგილს — თამაში ჩერდება და ხელახლა დაკავშირების ფანჯარაში მენიუდან შეგიძლიათ დაბრუნდეთ.',
    'game.quit': 'დატოვება',
    'game.quitDesc': 'მაშინვე ასრულებს თამაშს ყველასთვის.',
    'game.quitGame': 'თამაშის დატოვება',
    'game.cancel': 'გაუქმება',
    'game.paused': 'თამაში შეჩერებულია',
    'game.waitingReconnect': '{names}-ის ხელახლა დაკავშირებას ელოდება…',
    'game.aPlayer': 'მოთამაშე',
    'game.pauseNote': 'თუ ისინი დროულად არ დაბრუნდებიან, თამაში დასრულდება და ყველა მთავარ გვერდზე დაბრუნდება.',
    'game.points': 'ქულები',

    // Chat
    'chat.title': 'ჩატი',
    'chat.open': 'ჩატის გახსნა',
    'chat.close': 'ჩატის დახურვა',
    'chat.enterFullscreen': 'სრულ ეკრანზე გადასვლა',
    'chat.exitFullscreen': 'სრული ეკრანიდან გასვლა',
    'chat.send': 'გაგზავნა',
    'chat.empty': 'ჯერ შეტყობინებები არ არის. მიესალმეთ 👋',
    'chat.placeholder': 'დაწერეთ შეტყობინება…',

    // Toast (transient validation errors)
    'toast.signInRequired': 'ჯერ უნდა შეხვიდეთ სისტემაში',
    'toast.sameCardCount': 'უნდა ითამაშოთ იმავე რაოდენობის კარტი',
    'toast.sameSuit': 'უნდა ითამაშოთ ერთი მასტის კარტები',
}

export const translations: Record<Lang, Record<TranslationKey, string>> = { en, ka }
